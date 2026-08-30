#!/usr/bin/env python3
"""
校验教程正文里的原理示意图（<figure class="dg-figure">）。

用法：
    python3 validate_diagram.py <markdown-file> [更多 md 文件...]
    python3 validate_diagram.py src/content/tutorials/aes.md

检查项：
  [错误] SVG 不是合法 XML（常见于裸属性 data-flow>、未转义的 & < >）
  [错误] 全页 marker id 重复（不同 SVG 之间 id 会互相冲突）
  [错误] url(#xxx) 引用了未定义的 marker
  [错误] data-step 分组存在缺口或越界（会导致动画跳步）
  [错误] data-flow 分组里混入了非连线元素（虚线流动动画会作用到方块上）
  [错误] figure 内存在空行（Markdown 会把它切成两个段落，破坏结构）
  [错误] 缺少 figcaption
  [警告] data-steps 步数与分组不匹配
  [警告] 元素超出 viewBox 边界
  [警告] 文本可能溢出所在方块（按汉字≈font-size、ASCII≈0.55*font-size 估算）
  [警告] 未使用主题类（出现硬编码颜色）

退出码：有错误返回 1，否则返回 0。
"""

from __future__ import annotations

import json
import re
import sys
import xml.etree.ElementTree as ET

# 匹配 <figure ...> 开标签，允许属性值里出现 >
FIGURE_RE = re.compile(r"<figure\b(?:\"[^\"]*\"|'[^']*'|[^\"'>])*>", re.S)
SVG_RE = re.compile(r"<svg\b.*?</svg>", re.S)
ATTR_RE = re.compile(r"([:\w-]+)\s*=\s*(\"[^\"]*\"|'[^']*')", re.S)

# 文字宽度估算：CJK 约等于字号，ASCII 约 0.55 倍字号
FONT_SIZE = {
    "dg-t": 13.0,
    "dg-tb": 13.0,
    "dg-tl": 11.5,
    "dg-ts": 11.0,
    "dg-op": 15.0,
}
LINE_ELEMENTS = {"path", "line", "polyline", "text"}


class Report:
    def __init__(self, path: str) -> None:
        self.path = path
        self.errors: list[str] = []
        self.warnings: list[str] = []

    def error(self, msg: str) -> None:
        self.errors.append(msg)

    def warn(self, msg: str) -> None:
        self.warnings.append(msg)

    @property
    def ok(self) -> bool:
        return not self.errors


def local(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def text_width(text: str, size: float) -> float:
    w = 0.0
    for ch in text:
        if ord(ch) > 0x2E80:  # CJK 及全角标点
            w += size
        else:
            w += size * 0.55
    return w


def strip_html_comments(text: str) -> str:
    """移除 HTML 注释，但保留原有行数：
    - 注释独占一整行 → 连同该行一起删除
    - 注释只占行的一部分 → 只删除注释本身（内部的换行用等量换行补齐）

    这样注释既不会干扰标签匹配，也不会伪造出「空行」。
    """
    out: list[str] = []
    i = 0
    while True:
        m = re.search(r"<!--.*?-->", text[i:], re.S)
        if not m:
            out.append(text[i:])
            break
        start, end = i + m.start(), i + m.end()
        line_start = text.rfind("\n", 0, start) + 1
        line_end = text.find("\n", end)
        if line_end == -1:
            line_end = len(text)
        if text[line_start:start].strip() == "" and text[end:line_end].strip() == "":
            out.append(text[i:line_start])  # 整行注释，连行带换行一起去掉
            i = line_end + 1
        else:
            out.append(text[i:start])
            out.append("\n" * m.group(0).count("\n"))
            i = end
    return "".join(out)


def parse_figures(md: str) -> list[tuple[str, str, str]]:
    """返回 [(open_tag, inner, full_block)]"""
    out = []
    for m in FIGURE_RE.finditer(md):
        start = m.start()
        end = md.find("</figure>", m.end())
        if end == -1:
            continue
        end += len("</figure>")
        block = md[start:end]
        inner = block[m.end() - start : block.rfind("</figure>")]
        out.append((m.group(0), inner, block))
    return out


def check_file(path: str) -> Report:
    rep = Report(path)
    try:
        raw = open(path, encoding="utf-8").read()
    except OSError as exc:
        rep.error(f"无法读取文件：{exc}")
        return rep

    md = strip_html_comments(raw)
    figures = parse_figures(md)
    if not figures:
        rep.warn("未找到 <figure> 块")
        return rep

    seen_ids: dict[str, int] = {}

    for idx, (open_tag, inner, block) in enumerate(figures, 1):
        tag_name = f"图{idx}"
        attrs = {k: v[1:-1] for k, v in ATTR_RE.findall(open_tag)}

        if "dg-figure" not in attrs.get("class", ""):
            rep.warn(f"{tag_name}: class 缺少 dg-figure")

        # 1. figure 内不能有空行
        if "\n\n" in inner:
            rep.error(f"{tag_name}: <figure> 内部存在空行，会被 Markdown 切成两个段落")

        # 2. data-steps JSON
        steps: list[dict] | None = None
        if "data-steps" in attrs:
            raw = attrs["data-steps"]
            try:
                steps = json.loads(raw)
            except Exception as exc:
                rep.error(f"{tag_name}: data-steps 不是合法 JSON（{exc}）")
            else:
                if not steps:
                    rep.error(f"{tag_name}: data-steps 为空数组")
                else:
                    for i, s in enumerate(steps):
                        if not isinstance(s, dict) or "t" not in s or "d" not in s:
                            rep.error(f"{tag_name}: 第 {i + 1} 步缺少 t 或 d 字段")
                    if "data-interval" in attrs:
                        try:
                            int(attrs["data-interval"])
                        except ValueError:
                            rep.error(f"{tag_name}: data-interval 不是整数")

        # 3. figcaption
        if "<figcaption>" not in inner:
            rep.error(f"{tag_name}: 缺少 <figcaption> 图注")

        # 4. SVG 解析
        svg_match = SVG_RE.search(inner)
        if not svg_match:
            rep.error(f"{tag_name}: 未找到 <svg>")
            continue
        svg = svg_match.group(0)

        if re.search(r"\s(?:data-flow|data-step|checked|disabled)\s*>", svg):
            rep.error(f"{tag_name}: 存在裸布尔属性（如 data-flow>），必须写成 data-flow=\"1\"")

        try:
            root = ET.fromstring(svg)
        except ET.ParseError as exc:
            rep.error(f"{tag_name}: SVG 不是合法 XML — {exc}")
            continue

        if "viewBox" not in root.attrib:
            rep.error(f"{tag_name}: <svg> 缺少 viewBox")

        # 5. id 唯一 + marker 引用
        for el in root.iter():
            el_id = el.get("id")
            if el_id:
                if el_id in seen_ids:
                    rep.error(f"{tag_name}: id=\"{el_id}\" 与图{seen_ids[el_id]} 重复，全页必须唯一")
                else:
                    seen_ids[el_id] = idx

        defined = {el.get("id") for el in root.iter() if el.get("id")}
        for m in re.finditer(r"url\(#([^)]+)\)", svg):
            if m.group(1) not in defined:
                rep.error(f"{tag_name}: 引用了未定义的 marker/渐变 #{m.group(1)}")

        # 6. data-step 分组
        groups = [el for el in root.iter() if el.get("data-step") is not None]
        if groups:
            nums = set()
            for g in groups:
                try:
                    nums.add(int(g.get("data-step")))
                except (TypeError, ValueError):
                    rep.error(f"{tag_name}: data-step=\"{g.get('data-step')}\" 不是整数")

            if steps is None:
                rep.error(f"{tag_name}: 存在 data-step 分组但 figure 上没有 data-steps")
            else:
                total = len(steps)
                missing = [n for n in range(total) if n not in nums]
                extra = sorted(n for n in nums if n >= total)
                if missing:
                    rep.error(f"{tag_name}: 步骤 {missing} 没有任何 data-step 分组，动画会跳过")
                if extra:
                    rep.error(f"{tag_name}: data-step {extra} 超出 data-steps 范围（共 {total} 步）")

            # 7. data-flow 分组只放连线
            for g in groups:
                if g.get("data-flow") is None:
                    continue
                bad = [local(c.tag) for c in g if local(c.tag) not in LINE_ELEMENTS]
                if bad:
                    rep.error(f"{tag_name}: data-step={g.get('data-step')} 的 data-flow 分组混入了 {bad}，只应放 path/line/text")

        # 8. 硬编码颜色
        for m in re.finditer(r"(?:fill|stroke)\s*=\s*\"(#[0-9a-fA-F]{3,8}|rgba?\()", svg):
            rep.warn(f"{tag_name}: 存在硬编码颜色 {m.group(1)}，建议改用 .dg-* 主题类")

        # 9. 越界检查
        vb = root.get("viewBox")
        if vb:
            try:
                vx, vy, vw, vh = (float(x) for x in vb.replace(",", " ").split())
            except ValueError:
                vx, vy, vw, vh = 0, 0, 0, 0
            for el in root.iter():
                if local(el.tag) == "rect":
                    try:
                        x = float(el.get("x", 0))
                        y = float(el.get("y", 0))
                        w = float(el.get("width", 0))
                        h = float(el.get("height", 0))
                    except ValueError:
                        continue
                    if x < vx - 1 or y < vy - 1 or x + w > vx + vw + 1 or y + h > vy + vh + 1:
                        rep.warn(f"{tag_name}: rect({x},{y},{w},{h}) 超出 viewBox")

        # 10. 文本溢出估算：文本基线落在某个方块内，且横向宽度明显超出该方块
        rects = []
        for el in root.iter():
            if local(el.tag) == "rect" and el.get("width") and el.get("height"):
                try:
                    rects.append(
                        (
                            float(el.get("x", 0)),
                            float(el.get("y", 0)),
                            float(el.get("width")),
                            float(el.get("height")),
                        )
                    )
                except ValueError:
                    pass
        for el in root.iter():
            if local(el.tag) != "text":
                continue
            cls = (el.get("class") or "").split()
            size = next((FONT_SIZE[c] for c in cls if c in FONT_SIZE), 13.0)
            try:
                tx = float(el.get("x", 0))
                ty = float(el.get("y", 0))
            except ValueError:
                continue
            content = "".join(el.itertext()).strip()
            if not content:
                continue
            width = text_width(content, size)
            anchor = el.get("text-anchor") or root.get("text-anchor") or "start"
            if anchor == "middle":
                left = tx - width / 2
            elif anchor == "end":
                left = tx - width
            else:
                left = tx
            right = left + width
            for (rx, ry, rw, rh) in rects:
                in_band = ry - 2 <= ty <= ry + rh + 2
                overlaps = left < rx + rw and right > rx
                if in_band and overlaps and width > rw:
                    rep.warn(
                        f"{tag_name}: 文本「{content[:18]}」估算宽 {width:.0f}px 超过所在方块宽 {rw:.0f}px"
                    )
                    break

    return rep


def main(argv: list[str]) -> int:
    files = [a for a in argv[1:] if not a.startswith("-")]
    if not files:
        print(__doc__)
        return 2

    failed = False
    for path in files:
        rep = check_file(path)
        print(f"\n=== {path} ===")
        for msg in rep.errors:
            print(f"  [错误] {msg}")
        for msg in rep.warnings:
            print(f"  [警告] {msg}")
        if rep.ok and not rep.warnings:
            print("  ✓ 全部通过")
        elif rep.ok:
            print(f"  ✓ 无错误（{len(rep.warnings)} 条警告）")
        else:
            failed = True
            print(f"  ✗ {len(rep.errors)} 个错误")

    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
