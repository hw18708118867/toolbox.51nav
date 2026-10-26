#!/usr/bin/env python3
"""
刷新 Windows 补丁漏洞审计工具的漏洞数据库。

数据源：wesng 的 definitions.zip（https://github.com/bitsadmin/wesng），
其 CVEs_yyyyMMdd.csv 字段为：
  DatePosted,CVE,BulletinKB,Title,AffectedProduct,AffectedComponent,Severity,Impact,Supersedes,Exploits

本脚本：
  1. 下载最新 definitions.zip（或用 --definitions 指定本地包做测试）；
  2. 解析 CVEs CSV，筛选「提权(EoP) / 远程代码执行(RCE) 且有公开利用」的条目；
  3. 派生 osMatch（来自 AffectedProduct）、patchKbs（来自 BulletinKB）、ref（MSRC 链接）；
  4. 与现有 public/windows-patch-audit-db.json 中的「精选内置条目」合并（按 CVE 去重，内置优先，
     保留其中文标题与 Build 范围），输出新的包裹结构 { updated, entries }。

设计取舍：纯静态站点无法直连微软 MSRC，故以 wesng（业界事实标准的 Windows 补丁/CVE 映射库）
作为上游，自动把“高影响且有公开利用”的漏洞滚动进库；工具“更新漏洞数据库”按钮拉取的就是本文件，
因此随时间会自动变新。
"""

import argparse
import csv
import io
import json
import os
import sys
import urllib.request
import zipfile
from datetime import date

WESNG_URL = "https://github.com/bitsadmin/wesng/releases/latest/download/definitions.zip"

# (在 AffectedProduct 中出现的子串 -> 我们 osMatch 用的 token)
TOKEN_RULES = [
    ("windows 10", "windows 10"),
    ("windows 11", "windows 11"),
    ("windows 7", "windows 7"),
    ("windows 8.1", "windows 8.1"),
    ("windows server 2008", "windows server 2008"),
    ("windows server 2012", "windows server 2012"),
    ("windows server 2016", "windows server 2016"),
    ("windows server 2019", "windows server 2019"),
    ("windows server 2022", "windows server 2022"),
    ("windows server", "windows server"),
]

KEEP_IMPACTS = {"elevation of privilege", "remote code execution"}


def derive_os_match(affected_product: str):
    ap = (affected_product or "").lower()
    tokens = []
    for needle, token in TOKEN_RULES:
        if needle in ap and token not in tokens:
            tokens.append(token)
    # 已命中具体 Server 版本时，去掉笼统的 “windows server”，避免标签重复
    if any(t.startswith("windows server ") for t in tokens) and "windows server" in tokens:
        tokens.remove("windows server")
    return tokens


def parse_kbs(bulletin_kb: str):
    kbs = []
    for part in (bulletin_kb or "").split(","):
        part = part.strip()
        if part.isdigit():
            kbs.append(int(part))
    return kbs


def convert_row(row):
    impact = (row.get("Impact") or "").strip().lower()
    if impact not in KEEP_IMPACTS:
        return None
    exploits = (row.get("Exploits") or "").strip()
    # 仅纳入“有公开利用”的条目，避免概述表膨胀，也契合本工具“高影响+可武器化”的定位
    if not exploits:
        return None
    os_match = derive_os_match(row.get("AffectedProduct") or "")
    if not os_match:
        return None
    cve = (row.get("CVE") or "").strip()
    if not cve:
        return None
    vtype = "RCE" if impact == "remote code execution" else "EoP"
    return {
        "cve": cve,
        "titleZh": "",
        "titleEn": (row.get("Title") or "").strip(),
        "type": vtype,
        "exploit": bool(exploits),
        "osMatch": os_match,
        "patchKbs": parse_kbs(row.get("BulletinKB") or ""),
        "note": "",
        "ref": f"https://msrc.microsoft.com/update-guide/vulnerability/{cve}",
    }


def download_definitions(url):
    last_err = None
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=60) as resp:
                return resp.read()
        except Exception as e:  # noqa: BLE001
            last_err = e
            print(f"[!] 下载 definitions.zip 失败（第 {attempt + 1} 次）：{e}", file=sys.stderr)
    raise RuntimeError(f"无法下载 wesng definitions：{last_err}")


def parse_definitions(data: bytes):
    entries = {}
    with zipfile.ZipFile(io.BytesIO(data)) as zf:
        cves_files = [n for n in zf.namelist() if n.startswith("CVEs") and n.endswith(".csv")]
        if not cves_files:
            raise RuntimeError("definitions.zip 中找不到 CVEs*.csv")
        cves_file = sorted(cves_files)[-1]
        with zf.open(cves_file) as fh:
            reader = csv.DictReader(
                (line for line in io.TextIOWrapper(fh, encoding="utf-8-sig") if not line.startswith("#"))
            )
            for row in reader:
                entry = convert_row(row)
                if entry:
                    entries[entry["cve"]] = entry
    return entries


def load_seed(target_path):
    if not os.path.exists(target_path):
        return {}
    with open(target_path, "r", encoding="utf-8") as fh:
        data = json.load(fh)
    seed = data.get("entries", []) if isinstance(data, dict) else data
    return {e["cve"]: e for e in seed if "cve" in e}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--definitions", help="本地 definitions.zip 路径（测试用，缺省则联网下载）")
    ap.add_argument("--target", default="public/windows-patch-audit-db.json",
                    help="输出的 JSON 路径（默认 public/windows-patch-audit-db.json）")
    args = ap.parse_args()

    if args.definitions:
        with open(args.definitions, "rb") as fh:
            data = fh.read()
    else:
        data = download_definitions(WESNG_URL)

    upstream = parse_definitions(data)
    seed = load_seed(args.target)

    # 内置精选条目优先（保留中文标题、Build 范围），上游仅补充新增 CVE
    merged = dict(seed)
    added = 0
    for cve, entry in upstream.items():
        if cve not in merged:
            merged[cve] = entry
            added += 1

    entries = list(merged.values())

    # 若条目集合与现有文件一致，则不改写（避免每周只是更新日期导致无谓提交/重部署）
    if os.path.exists(args.target):
        try:
            with open(args.target, "r", encoding="utf-8") as fh:
                cur = json.load(fh)
            cur_entries = cur.get("entries", []) if isinstance(cur, dict) else cur
            if cur_entries == entries:
                print("[+] 数据库条目无变化，跳过写入。")
                return
        except Exception:  # noqa: BLE001
            pass

    out = {"updated": date.today().isoformat(), "entries": entries}
    with open(args.target, "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, indent=2)
        fh.write("\n")

    print(f"[+] 完成：内置 {len(seed)} 条，上游匹配 {len(upstream)} 条，新增 {added} 条，合计 {len(entries)} 条。")
    print(f"[+] 已写入 {args.target}（updated={out['updated']}）。")


if __name__ == "__main__":
    main()
