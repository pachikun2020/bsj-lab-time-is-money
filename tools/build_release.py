"""Build a local allow-listed preview package. No deployment or network calls."""
from pathlib import Path
import argparse,hashlib,json,re,shutil,subprocess,zipfile

ROOT=Path(__file__).resolve().parents[1]
ASSETS=['index.html','app.js','countries.js','i18n.js','sw.js','manifest.webmanifest','manifest.en.webmanifest','manifest.zh.webmanifest','icon-192-yen.png','icon-512-yen.png','meeting-room-hero.webp']
NOTICES=['LICENSE','ASSETS.md','THIRD_PARTY_NOTICES.md']
def build(destination):
    out=destination.resolve()
    root=ROOT.resolve()
    if root==out or root in out.parents: raise ValueError('Output must stay outside the source repository')
    if out.exists(): raise ValueError('Output already exists; use a new destination')
    source={}
    for name in ASSETS+NOTICES:
        p=ROOT/name
        if p.is_symlink() or not p.is_file(): raise ValueError('Missing or linked asset: '+name)
        data=p.read_bytes()
        if (p.suffix in ('.js','.html','.webmanifest','.md') or name=='LICENSE') and re.search(rb'-----BEGIN .*PRIVATE KEY-----|sk-ant-[A-Za-z0-9_-]{16,}|AKIA[0-9A-Z]{16}',data): raise ValueError('Secret pattern in '+name)
        source[name]=data
    referenced=re.search(r'const ASSETS = \[(.*?)\];',source['sw.js'].decode(),re.S)
    cached={n.removeprefix('./') for n in re.findall(r"'([^']+)'",referenced.group(1)) if n!='./'}
    if cached!=set(ASSETS)-{'sw.js'}: raise ValueError('Service Worker asset list does not match release allow-list')
    for name in ('manifest.webmanifest','manifest.en.webmanifest','manifest.zh.webmanifest'):
        m=json.loads(source[name]);assert m['start_url']=='./' and m['scope']=='./'
        for icon in m['icons']: assert icon['src'].removeprefix('./') in source
    versions=set(re.findall(r'v\d+\.\d+\.\d+(?:-qa)?',source['i18n.js'].decode()))
    if len(versions)!=1: raise ValueError('Runtime version is missing or inconsistent')
    site=out/'site';site.mkdir(parents=True)
    for name,data in source.items(): (site/name).write_bytes(data)
    shutil.copyfile(ROOT/'deploy/pages-preview-headers',site/'_headers')
    (site/'404.html').write_text('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>404 | BSJ LAB · Time is Money ミーティングコストカウンター / MERYDS</title><h1>Time is Money ミーティングコストカウンター</h1><p>Page not found / ページが見つかりません / 未找到页面</p><a href="/">Open Time is Money</a></html>')
    (site/'robots.txt').write_text('User-agent: *\nDisallow: /\n')
    revision=subprocess.check_output(['git','-C',str(ROOT),'rev-parse','HEAD'],text=True).strip()
    manifest={'source_revision':revision,'runtime_version':versions.pop(),'profile':'pages-preview-root','deploy_performed':False,'files':[{'path':p.name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(site.iterdir())],'excluded':['.git','README','internal reports','API scripts','credentials','CSV exports','source ZIP','reference images'],'notes':['Root-hosted preview only; do not merge these headers into the BSJ LAB LP without path scoping.','noindex is not authentication. Protected preview requires a separate access-control decision.','Public hosting approval, trademark review and remaining installed-PWA checks are pending; MIT is selected.']}
    (out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    with zipfile.ZipFile(out/'time-is-money-preview.zip','w',zipfile.ZIP_DEFLATED) as z:
        for p in sorted(site.iterdir()):z.write(p,p.name)
    print(json.dumps({'output':str(out),'deployment_files':len(manifest['files']),'source_revision':revision,'deployed':False}))
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--out',type=Path,required=True);args=parser.parse_args();build(args.out)
