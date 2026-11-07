# -*- coding: utf-8 -*-
"""
Bộ giải mã MathType Equation (MTEF v3 / v5) -> LaTeX, viết theo đặc tả MTEF chính thức.
Dùng cho các đối tượng OLE "Equation.DSMT4" (MathType) và "Equation.3" (Equation Editor 3.0).
"""
import io
import re
import struct
import unicodedata

import olefile

# ---------------------------------------------------------------------------
# Bảng ký tự Unicode -> LaTeX
# ---------------------------------------------------------------------------
GREEK = {
    0x03B1: r'\alpha', 0x03B2: r'\beta', 0x03B3: r'\gamma', 0x03B4: r'\delta',
    0x03B5: r'\varepsilon', 0x03F5: r'\epsilon', 0x03B6: r'\zeta', 0x03B7: r'\eta',
    0x03B8: r'\theta', 0x03D1: r'\vartheta', 0x03B9: r'\iota', 0x03BA: r'\kappa',
    0x03BB: r'\lambda', 0x03BC: r'\mu', 0x03BD: r'\nu', 0x03BE: r'\xi', 0x03BF: 'o',
    0x03C0: r'\pi', 0x03D6: r'\varpi', 0x03C1: r'\rho', 0x03F1: r'\varrho',
    0x03C2: r'\varsigma', 0x03C3: r'\sigma', 0x03C4: r'\tau', 0x03C5: r'\upsilon',
    0x03C6: r'\varphi', 0x03D5: r'\phi', 0x03C7: r'\chi', 0x03C8: r'\psi', 0x03C9: r'\omega',
    0x0391: 'A', 0x0392: 'B', 0x0393: r'\Gamma', 0x0394: r'\Delta', 0x0395: 'E', 0x0396: 'Z',
    0x0397: 'H', 0x0398: r'\Theta', 0x0399: 'I', 0x039A: 'K', 0x039B: r'\Lambda', 0x039C: 'M',
    0x039D: 'N', 0x039E: r'\Xi', 0x039F: 'O', 0x03A0: r'\Pi', 0x03A1: 'P', 0x03A3: r'\Sigma',
    0x03A4: 'T', 0x03A5: r'\Upsilon', 0x03A6: r'\Phi', 0x03A7: 'X', 0x03A8: r'\Psi',
    0x03A9: r'\Omega', 0x2126: r'\Omega', 0x2206: r'\Delta',
}

SYMBOLS = {
    0x2212: '-', 0x2013: '-', 0x2014: '-', 0x00B1: r'\pm', 0x2213: r'\mp', 0x00D7: r'\times',
    0x00F7: r'\div', 0x22C5: r'\cdot', 0x00B7: r'\cdot', 0x2219: r'\cdot', 0x2022: r'\bullet',
    0x2264: r'\le', 0x2265: r'\ge', 0x2A7D: r'\leqslant', 0x2A7E: r'\geqslant',
    0x2266: r'\leqq', 0x2267: r'\geqq', 0x2260: r'\ne', 0x2248: r'\approx', 0x2261: r'\equiv',
    0x2262: r'\not\equiv', 0x223C: r'\sim', 0x2245: r'\cong', 0x2243: r'\simeq', 0x221D: r'\propto',
    0x226A: r'\ll', 0x226B: r'\gg', 0x2270: r'\nleq', 0x2271: r'\ngeq', 0x226E: r'\nless',
    0x226F: r'\ngtr', 0x2250: r'\doteq', 0x225D: r'\overset{\text{def}}{=}',
    0x221E: r'\infty', 0x2192: r'\to', 0x2190: r'\leftarrow', 0x2194: r'\leftrightarrow',
    0x21D2: r'\Rightarrow', 0x21D0: r'\Leftarrow', 0x21D4: r'\Leftrightarrow',
    0x27F9: r'\Longrightarrow', 0x27F8: r'\Longleftarrow', 0x27FA: r'\Longleftrightarrow',
    0x27F6: r'\longrightarrow', 0x27F5: r'\longleftarrow', 0x2191: r'\uparrow',
    0x2193: r'\downarrow', 0x21C4: r'\rightleftarrows', 0x21C6: r'\leftrightarrows',
    0x21A6: r'\mapsto', 0x2197: r'\nearrow', 0x2198: r'\searrow',
    0x2208: r'\in', 0x2209: r'\notin', 0x220B: r'\ni', 0x2282: r'\subset', 0x2283: r'\supset',
    0x2286: r'\subseteq', 0x2287: r'\supseteq', 0x2284: r'\not\subset', 0x2288: r'\nsubseteq',
    0x222A: r'\cup', 0x2229: r'\cap', 0x2205: r'\varnothing', 0x00D8: r'\varnothing',
    0x2216: r'\setminus', 0x2200: r'\forall', 0x2203: r'\exists', 0x2204: r'\nexists',
    0x2220: r'\angle', 0x2221: r'\measuredangle', 0x22A5: r'\perp', 0x27C2: r'\perp',
    0x2225: r'\parallel', 0x2226: r'\nparallel', 0x2016: r'\|', 0x2223: r'\mid', 0x2224: r'\nmid',
    0x00B0: r'^{\circ}', 0x2218: r'\circ', 0x2032: "'", 0x2033: "''", 0x2034: "'''",
    0x2026: r'\ldots', 0x22EF: r'\cdots', 0x22EE: r'\vdots', 0x22F1: r'\ddots',
    0x2211: r'\sum', 0x220F: r'\prod', 0x2210: r'\coprod', 0x222B: r'\int', 0x222C: r'\iint',
    0x222D: r'\iiint', 0x222E: r'\oint', 0x221A: r'\surd', 0x2202: r'\partial', 0x2207: r'\nabla',
    0x2115: r'\mathbb{N}', 0x2124: r'\mathbb{Z}', 0x211A: r'\mathbb{Q}', 0x211D: r'\mathbb{R}',
    0x2102: r'\mathbb{C}', 0x2227: r'\wedge', 0x2228: r'\vee', 0x00AC: r'\neg',
    0x25B3: r'\triangle', 0x2206: r'\Delta', 0x25A1: r'\square', 0x25CB: r'\bigcirc',
    0x2234: r'\therefore', 0x2235: r'\because', 0x2295: r'\oplus', 0x2297: r'\otimes',
    0x27E8: r'\langle', 0x27E9: r'\rangle', 0x2329: r'\langle', 0x232A: r'\rangle',
    0x2308: r'\lceil', 0x2309: r'\rceil', 0x230A: r'\lfloor', 0x230B: r'\rfloor',
    0x22C3: r'\bigcup', 0x22C2: r'\bigcap', 0x2322: r'\frown', 0x2323: r'\smile',
    0x2312: r'\frown', 0x0302: r'\hat{}', 0x2192 + 0x10000: r'\to',
    0x2003: r'\quad', 0x2002: r'\enspace', 0x2005: r'\;', 0x2009: r'\,', 0x200A: r'\,',
    0x00A0: '~', 0x2004: r'\;', 0x2006: r'\,', 0x2007: r'\,', 0x2008: r'\,',
    0x200B: '', 0x2060: '', 0x2061: '', 0x2062: '', 0x2063: '', 0xFEFF: '',
    0x2215: '/', 0x2044: '/', 0x2010: '-', 0x2011: '-', 0x2012: '-',
    0x02C6: r'\hat{}', 0x02DC: r'\sim', 0x2192: r'\to', 0x00AF: r'\overline{}',
    0x2329: r'\langle', 0x00A6: '|', 0x2502: '|', 0x2223: r'\mid',
    0x2283: r'\supset', 0x22A2: r'\vdash', 0x22A8: r'\models',
    0x00BC: r'\frac{1}{4}', 0x00BD: r'\frac{1}{2}', 0x00BE: r'\frac{3}{4}',
    0x00B2: '^{2}', 0x00B3: '^{3}', 0x00B9: '^{1}',
    0x2070: '^{0}', 0x2074: '^{4}', 0x2075: '^{5}', 0x2076: '^{6}', 0x2077: '^{7}',
    0x2078: '^{8}', 0x2079: '^{9}', 0x207B: '^{-}', 0x207A: '^{+}',
    0x2080: '_{0}', 0x2081: '_{1}', 0x2082: '_{2}', 0x2083: '_{3}', 0x2084: '_{4}',
    0x2219: r'\cdot', 0x25E6: r'\circ', 0x2605: r'\star', 0x22C6: r'\star',
    0x2733: '*', 0x2217: '*', 0x2020: r'\dagger',
    0x2198: r'\searrow', 0x2197: r'\nearrow', 0x21C0: r'\rightharpoonup',
    0x2196: r'\nwarrow', 0x2199: r'\swarrow',
}

ASCII_ESCAPE = {
    '{': r'\{', '}': r'\}', '%': r'\%', '#': r'\#', '&': r'\&', '_': r'\_', '$': r'\$',
    '\\': r'\backslash', '~': r'\sim', '^': r'\wedge', '"': "''",
}

TEXT_ESCAPE = {
    '\\': r'\textbackslash{}', '{': r'\{', '}': r'\}', '%': r'\%', '#': r'\#', '&': r'\&',
    '_': r'\_', '$': r'\$', '^': r'\textasciicircum{}', '~': r'\textasciitilde{}',
}

KNOWN_FUNCS = {
    'sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'log', 'ln', 'lg', 'lim', 'max', 'min', 'exp',
    'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh', 'coth', 'det', 'gcd', 'deg', 'dim',
    'ker', 'inf', 'sup', 'arg', 'Pr', 'hom', 'liminf', 'limsup',
}

# Typeface (value đã trừ 128)
FN_TEXT, FN_FUNCTION, FN_VARIABLE, FN_LCGREEK, FN_UCGREEK, FN_SYMBOL, FN_VECTOR, FN_NUMBER = 1, 2, 3, 4, 5, 6, 7, 8
FN_MTEXTRA, FN_TEXT_FE, FN_EXPAND, FN_MARKER, FN_SPACE = 11, 12, 22, 23, 24

# Bảng mã Symbol font (dùng cho MTEF v3 không có mã Unicode)
SYMBOL_FONT = {
    0x61: 0x03B1, 0x62: 0x03B2, 0x63: 0x03C7, 0x64: 0x03B4, 0x65: 0x03B5, 0x66: 0x03C6,
    0x67: 0x03B3, 0x68: 0x03B7, 0x69: 0x03B9, 0x6A: 0x03D5, 0x6B: 0x03BA, 0x6C: 0x03BB,
    0x6D: 0x03BC, 0x6E: 0x03BD, 0x6F: 0x03BF, 0x70: 0x03C0, 0x71: 0x03B8, 0x72: 0x03C1,
    0x73: 0x03C3, 0x74: 0x03C4, 0x75: 0x03C5, 0x76: 0x03D6, 0x77: 0x03C9, 0x78: 0x03BE,
    0x79: 0x03C8, 0x7A: 0x03B6, 0x44: 0x0394, 0x46: 0x03A6, 0x47: 0x0393, 0x4C: 0x039B,
    0x50: 0x03A0, 0x51: 0x0398, 0x53: 0x03A3, 0x57: 0x03A9, 0x58: 0x039E, 0x59: 0x03A8,
    0xA3: 0x2264, 0xB3: 0x2265, 0xB9: 0x2260, 0xB1: 0x00B1, 0xB4: 0x00D7, 0xB8: 0x00F7,
    0xB0: 0x00B0, 0xA5: 0x221E, 0xAE: 0x2192, 0xDE: 0x21D2, 0xDB: 0x21D4, 0xCE: 0x2208,
    0xCF: 0x2209, 0xCC: 0x2282, 0xC8: 0x222A, 0xC7: 0x2229, 0xC6: 0x2205, 0xD0: 0x2220,
    0x5E: 0x22A5, 0xBB: 0x2248, 0xBA: 0x2261, 0x2D: 0x2212, 0xD7: 0x22C5, 0xBC: 0x2026,
    0xA2: 0x2032, 0xB2: 0x2033, 0x22: 0x2200, 0x24: 0x2203, 0xD6: 0x221A, 0xE5: 0x2211,
    0xF2: 0x222B, 0xB6: 0x2202, 0x7E: 0x223C, 0x40: 0x2245, 0xAC: 0x2190, 0xAB: 0x2194,
    0xDC: 0x21D0, 0xE1: 0x27E8, 0xF1: 0x27E9, 0xC5: 0x2295, 0xC4: 0x2297, 0x7C: 0x007C,
}


def _is_cmd_end(s):
    return re.search(r'\\[a-zA-Z]+$', s) is not None


def join_tokens(tokens):
    out = ''
    for t in tokens:
        if not t:
            continue
        if out and _is_cmd_end(out) and (t[0].isalpha()):
            out += ' '
        out += t
    return out


def char_to_latex(code, typeface=FN_VARIABLE):
    if code in GREEK:
        return GREEK[code]
    if code in SYMBOLS:
        return SYMBOLS[code]
    if code < 128:
        c = chr(code)
        if c in ASCII_ESCAPE:
            return ASCII_ESCAPE[c]
        if c == ' ':
            return r'\ '
        if c == "'":
            return "'"
        if code < 32:
            return ''
        return c
    if 0xE000 <= code <= 0xF8FF:
        # Ký tự vùng riêng của MathType (MT Extra): khoảng trắng, glyph trang trí...
        mt_extra = {
            0xEB1A: r'\to', 0xEC0C: r'\Rightarrow', 0xE98F: r'\Rightarrow', 0xE990: r'\Leftrightarrow',
            0xEB01: r'\ldots', 0xEB02: r'\cdots', 0xEB05: r'\ddots', 0xEC07: r'\angle',
        }
        return mt_extra.get(code, '')
    ch = chr(code)
    cat = unicodedata.category(ch)
    if cat.startswith('L'):
        return r'\text{' + ch + '}'
    if cat.startswith('Z'):
        return r'\ '
    if cat.startswith('M'):
        return ''
    return ch


# ---------------------------------------------------------------------------
# Đọc dữ liệu nhị phân
# ---------------------------------------------------------------------------
class Reader:
    def __init__(self, data, pos=0):
        self.d = data
        self.p = pos

    def eof(self):
        return self.p >= len(self.d)

    def byte(self):
        if self.p >= len(self.d):
            raise EOFError
        b = self.d[self.p]
        self.p += 1
        return b

    def peek(self):
        if self.p >= len(self.d):
            return None
        return self.d[self.p]

    def u16(self):
        if self.p + 2 > len(self.d):
            raise EOFError
        v = self.d[self.p] | (self.d[self.p + 1] << 8)
        self.p += 2
        return v

    def uint(self):
        b = self.byte()
        if b == 255:
            return self.u16()
        return b

    def cstr(self):
        end = self.d.find(b'\x00', self.p)
        if end == -1:
            end = len(self.d)
        s = self.d[self.p:end]
        self.p = end + 1
        return s.decode('latin-1', errors='ignore')

    def nudge(self):
        dx = self.byte()
        dy = self.byte()
        if dx == 128 and dy == 128:
            self.u16()
            self.u16()

    def skip_nibble_dims(self, count):
        """Bỏ qua mảng kích thước mã hoá nibble (mỗi giá trị kết thúc bằng nibble 0xF)."""
        done = 0
        while done < count:
            b = self.byte()
            for nib in ((b >> 4) & 0xF, b & 0xF):
                if nib == 0xF:
                    done += 1
                    if done >= count:
                        break


# ---------------------------------------------------------------------------
# Cấu trúc nút
# ---------------------------------------------------------------------------
class Line:
    __slots__ = ('items', 'null')

    def __init__(self, items, null=False):
        self.items = items
        self.null = null


class Char:
    __slots__ = ('code', 'typeface', 'embells', 'func_start')

    def __init__(self, code, typeface, embells, func_start):
        self.code = code
        self.typeface = typeface
        self.embells = embells
        self.func_start = func_start


class Tmpl:
    __slots__ = ('selector', 'variation', 'items')

    def __init__(self, selector, variation, items):
        self.selector = selector
        self.variation = variation
        self.items = items


class Pile:
    __slots__ = ('halign', 'lines')

    def __init__(self, halign, lines):
        self.halign = halign
        self.lines = lines


class Matrix:
    __slots__ = ('rows', 'cols', 'items')

    def __init__(self, rows, cols, items):
        self.rows = rows
        self.cols = cols
        self.items = items


# ---------------------------------------------------------------------------
# Parser MTEF v5
# ---------------------------------------------------------------------------
class ParserV5:
    def __init__(self, data):
        self.r = Reader(data)

    def parse(self):
        r = self.r
        version = r.byte()
        if version != 5:
            raise ValueError('not v5')
        r.byte()  # platform
        r.byte()  # product
        r.byte()  # product version
        r.byte()  # product subversion
        r.cstr()  # application key
        r.byte()  # equation options
        return self.object_list(top=True)

    def object_list(self, top=False):
        r = self.r
        items = []
        while not r.eof():
            tag = r.byte()
            if tag == 0:
                break
            node = self.record(tag)
            if node is not None:
                items.append(node)
        return items

    def record(self, tag):
        r = self.r
        if tag == 1:  # LINE
            opt = r.byte()
            if opt & 0x08:
                r.nudge()
            if opt & 0x04:
                r.u16()
            if opt & 0x02:
                t = r.byte()
                self.record(t)
            if opt & 0x01:
                return Line([], null=True)
            return Line(self.object_list())
        if tag == 2:  # CHAR
            opt = r.byte()
            if opt & 0x08:
                r.nudge()
            tf = r.uint() - 128
            code = None
            if not (opt & 0x20):
                code = r.u16()
            if opt & 0x04:
                fp = r.byte()
                if code is None:
                    code = fp
            if opt & 0x10:
                fp = r.u16()
                if code is None:
                    code = fp
            embells = []
            if opt & 0x01:
                for e in self.object_list():
                    if isinstance(e, tuple) and e[0] == 'embell':
                        embells.append(e[1])
            return Char(code or 0, tf, embells, bool(opt & 0x02))
        if tag == 3:  # TMPL
            opt = r.byte()
            if opt & 0x08:
                r.nudge()
            sel = r.byte()
            v1 = r.byte()
            var = v1
            if v1 & 0x80:
                v2 = r.byte()
                var = (v1 & 0x7F) | (v2 << 8)
            r.byte()  # template-specific options
            return Tmpl(sel, var, self.object_list())
        if tag == 4:  # PILE
            opt = r.byte()
            if opt & 0x08:
                r.nudge()
            halign = r.byte()
            r.byte()  # valign
            if opt & 0x02:
                t = r.byte()
                self.record(t)
            lines = [x for x in self.object_list() if isinstance(x, (Line, Pile, Matrix, Tmpl))]
            return Pile(halign, lines)
        if tag == 5:  # MATRIX
            opt = r.byte()
            if opt & 0x08:
                r.nudge()
            r.byte()  # valign
            r.byte()  # h_just
            r.byte()  # v_just
            rows = r.byte()
            cols = r.byte()
            r.p += ((rows + 1) * 2 + 7) // 8
            r.p += ((cols + 1) * 2 + 7) // 8
            return Matrix(rows, cols, self.object_list())
        if tag == 6:  # EMBELL
            opt = r.byte()
            if opt & 0x08:
                r.nudge()
            et = r.byte()
            return ('embell', et)
        if tag == 7:  # RULER
            n = r.uint()
            for _ in range(n):
                r.byte()
                r.u16()
            return None
        if tag == 8:  # FONT_STYLE_DEF
            r.uint()
            r.byte()
            return None
        if tag == 9:  # SIZE
            b = r.byte()
            if b == 101:
                r.u16()
            elif b == 100:
                r.byte()
                r.u16()
            else:
                r.byte()
            return None
        if 10 <= tag <= 14:
            return None
        if tag == 15:  # COLOR
            r.uint()
            return None
        if tag == 16:  # COLOR_DEF
            opt = r.byte()
            n = 4 if opt & 0x01 else 3
            for _ in range(n):
                r.u16()
            if opt & 0x04:
                r.cstr()
            return None
        if tag == 17:  # FONT_DEF
            r.uint()
            r.cstr()
            return None
        if tag == 18:  # EQN_PREFS
            r.byte()
            n = r.uint()
            r.skip_nibble_dims(n)
            n = r.uint()
            r.skip_nibble_dims(n)
            n = r.uint()
            for _ in range(n):
                f = r.uint()
                if f:
                    r.byte()
            return None
        if tag == 19:  # ENCODING_DEF
            r.cstr()
            return None
        if tag >= 100:  # FUTURE
            n = r.uint()
            r.p += n
            return None
        # Bỏ qua tag lạ không nhận dạng được để không làm crash toàn bộ công thức
        return None


# ---------------------------------------------------------------------------
# Parser MTEF v3 (Equation Editor 3.0)
# ---------------------------------------------------------------------------
class ParserV3:
    def __init__(self, data):
        self.r = Reader(data)
        self.fonts = {}

    def parse(self):
        r = self.r
        if r.byte() != 3:
            raise ValueError('not v3')
        r.byte(); r.byte(); r.byte(); r.byte()
        return self.object_list()

    def object_list(self):
        r = self.r
        items = []
        while not r.eof():
            b = r.byte()
            tag = b & 0x0F
            opt = b >> 4
            if tag == 0:
                break
            node = self.record(tag, opt)
            if node is not None:
                items.append(node)
        return items

    def record(self, tag, opt):
        r = self.r
        if tag == 1:  # LINE
            if opt & 0x08:
                r.nudge()
            if opt & 0x04:
                r.u16()
            if opt & 0x02:
                b = r.byte()
                self.record(b & 0x0F, b >> 4)
            if opt & 0x01:
                return Line([], null=True)
            return Line(self.object_list())
        if tag == 2:  # CHAR
            if opt & 0x08:
                r.nudge()
            tf = r.byte() - 128 if True else 0
            if tf > 127:
                tf -= 256
            code = r.u16()
            if tf == FN_SYMBOL or tf == FN_LCGREEK or tf == FN_UCGREEK:
                if code < 256 and code in SYMBOL_FONT:
                    code = SYMBOL_FONT[code]
            elif tf == FN_MTEXTRA:
                code = {0x2E: 0x2026, 0x4C: 0x2026, 0xAE: 0x2192}.get(code, 0xE000)
            embells = []
            if opt & 0x02:
                for e in self.object_list():
                    if isinstance(e, tuple):
                        embells.append(e[1])
            return Char(code, tf, embells, False)
        if tag == 3:  # TMPL
            if opt & 0x08:
                r.nudge()
            sel = r.byte()
            var = r.byte()
            r.byte()
            return Tmpl(sel, var, self.object_list())
        if tag == 4:  # PILE
            if opt & 0x08:
                r.nudge()
            halign = r.byte()
            r.byte()
            if opt & 0x02:
                b = r.byte()
                self.record(b & 0x0F, b >> 4)
            return Pile(halign, [x for x in self.object_list() if isinstance(x, (Line, Pile, Matrix, Tmpl))])
        if tag == 5:  # MATRIX
            if opt & 0x08:
                r.nudge()
            r.byte(); r.byte(); r.byte()
            rows = r.byte()
            cols = r.byte()
            r.p += ((rows + 1) * 2 + 7) // 8
            r.p += ((cols + 1) * 2 + 7) // 8
            return Matrix(rows, cols, self.object_list())
        if tag == 6:  # EMBELL
            if opt & 0x08:
                r.nudge()
            return ('embell', r.byte())
        if tag == 7:  # RULER
            n = r.byte()
            for _ in range(n):
                r.byte(); r.u16()
            return None
        if tag == 8:  # FONT
            r.byte(); r.byte(); r.cstr()
            return None
        if tag == 9:  # SIZE
            b = r.byte()
            if b == 101:
                r.u16()
            elif b == 100:
                r.byte(); r.u16()
            else:
                r.byte()
            return None
        if 10 <= tag <= 14:
            return None
        return None


# ---------------------------------------------------------------------------
# Chuyển cây nút -> LaTeX
# ---------------------------------------------------------------------------
FENCE_DEFAULT = {
    0: (r'\langle', r'\rangle'), 1: ('(', ')'), 2: (r'\{', r'\}'), 3: ('[', ']'),
    4: ('|', '|'), 5: (r'\|', r'\|'), 6: (r'\lfloor', r'\rfloor'), 7: (r'\lceil', r'\rceil'),
    8: (r'[\![', r']\!]'), 9: ('(', ')'),
}

FENCE_CHAR = {
    0x28: '(', 0x29: ')', 0x5B: '[', 0x5D: ']', 0x7B: r'\{', 0x7D: r'\}', 0x7C: '|',
    0x2016: r'\|', 0x27E8: r'\langle', 0x27E9: r'\rangle', 0x2329: r'\langle', 0x232A: r'\rangle',
    0x230A: r'\lfloor', 0x230B: r'\rfloor', 0x2308: r'\lceil', 0x2309: r'\rceil',
}

BIGOP_DEFAULT = {15: r'\int', 16: r'\sum', 17: r'\prod', 18: r'\coprod', 19: r'\bigcup',
                 20: r'\bigcap', 21: r'\int', 22: r'\sum'}


class LatexWriter:
    def line(self, node):
        if node is None:
            return ''
        if isinstance(node, Line):
            return self.items(node.items).strip()
        return self.items([node]).strip()

    def items(self, items):
        tokens = []
        i = 0
        n = len(items)
        while i < n:
            it = items[i]
            if isinstance(it, Char):
                tf = it.typeface
                # Cụm tên hàm (sin, cos, log, lim...)
                if (tf == FN_FUNCTION or it.func_start) and it.code < 128 and chr(it.code).isalpha() and not it.embells:
                    word = chr(it.code)
                    j = i + 1
                    while j < n and isinstance(items[j], Char) and items[j].typeface == FN_FUNCTION \
                            and items[j].code < 128 and chr(items[j].code).isalpha() \
                            and not items[j].func_start and not items[j].embells:
                        word += chr(items[j].code)
                        j += 1
                    tokens.append(self.func_word(word))
                    i = j
                    continue
                # Cụm văn bản
                if tf in (FN_TEXT, FN_TEXT_FE):
                    txt = ''
                    j = i
                    while j < n and isinstance(items[j], Char) and items[j].typeface in (FN_TEXT, FN_TEXT_FE) \
                            and not items[j].embells:
                        c = items[j].code
                        if c in GREEK or c in SYMBOLS and c not in (0x2212, 0x2013):
                            break
                        txt += chr(c) if c >= 32 else ''
                        j += 1
                    if j == i:
                        tokens.append(self.char(it))
                        i += 1
                        continue
                    tokens.append(self.text(txt))
                    i = j
                    continue
                tokens.append(self.char(it))
                i += 1
                continue
            if isinstance(it, Tmpl):
                sel = it.selector
                if sel in (27, 28, 29):
                    s = self.subsup(it)
                    if not tokens or tokens[-1] in ('', ' '):
                        tokens.append('{}')
                    elif tokens[-1].endswith('^{\\circ}') or re.search(r'[_^]\{[^{}]*\}$', tokens[-1]):
                        tokens[-1] = '{' + tokens[-1] + '}'
                    tokens.append(s)
                else:
                    tokens.append(self.tmpl(it))
                i += 1
                continue
            if isinstance(it, Line):
                tokens.append(self.line(it))
                i += 1
                continue
            if isinstance(it, Pile):
                tokens.append(self.pile(it))
                i += 1
                continue
            if isinstance(it, Matrix):
                tokens.append(self.matrix(it))
                i += 1
                continue
            i += 1
        out = join_tokens(tokens)
        # dấu phẩy thập phân kiểu Việt Nam: 1,5 -> 1{,}5
        out = re.sub(r'(\d),(\d)', r'\1{,}\2', out)
        return out

    def func_word(self, word):
        if word in KNOWN_FUNCS:
            return '\\' + word
        # các tổ hợp như "cosx" hiếm gặp; tg/cotg (ký hiệu Việt Nam)
        for f in sorted(KNOWN_FUNCS, key=len, reverse=True):
            if word.startswith(f) and len(word) > len(f):
                return '\\' + f + ' ' + word[len(f):]
        return r'\operatorname{' + word + '}'

    def text(self, txt):
        if not txt.strip():
            return r'\ ' if txt else ''
        esc = ''.join(TEXT_ESCAPE.get(c, c) for c in txt)
        return r'\text{' + esc + '}'

    def char(self, ch):
        tf = ch.typeface
        code = ch.code
        if tf == FN_SPACE:
            base = r'\,' if code not in (0xEF05, 0xEF06) else r'\quad'
            return base
        if tf == FN_NUMBER or tf == FN_VARIABLE or tf in (FN_LCGREEK, FN_UCGREEK, FN_SYMBOL, FN_VECTOR):
            base = char_to_latex(code, tf)
            if tf == FN_VECTOR and code < 128 and chr(code).isalpha():
                base = r'\mathbf{' + chr(code) + '}'
        else:
            base = char_to_latex(code, tf)
        for e in ch.embells:
            base = self.embell(base, e)
        return base

    def embell(self, base, e):
        wrap = {
            2: r'\dot', 3: r'\ddot', 4: r'\dddot', 8: r'\tilde', 9: r'\hat', 11: r'\vec',
            12: r'\overleftarrow', 13: r'\overleftrightarrow', 14: r'\overrightharpoon',
            15: r'\overleftharpoon', 17: r'\bar', 21: r'\cancel', 24: r'\ddddot', 29: r'\underline',
            30: r'\utilde', 19: r'\overgroup', 20: r'\overgroup',
        }
        if e in wrap:
            if base.startswith('^') or base.startswith('_'):
                return base
            return wrap[e] + '{' + base + '}'
        if e == 5:
            return base + "'"
        if e == 6:
            return base + "''"
        if e == 18:
            return base + "'''"
        if e == 7:
            return base + r'\backprime'
        if e == 10 or e == 16:
            return r'\not' + (' ' if base[:1].isalpha() else '') + base
        return base

    def subsup(self, t):
        lines = [x for x in t.items if isinstance(x, Line)]
        sub = self.line(lines[0]) if len(lines) > 0 and not lines[0].null else ''
        sup = self.line(lines[1]) if len(lines) > 1 and not lines[1].null else ''
        if t.selector == 28 and len(lines) == 1:
            sup, sub = sub, ''
        out = ''
        if sub:
            out += '_{' + sub + '}'
        if sup:
            out += '^{' + sup + '}'
        return out

    def fence_pair(self, t, chars):
        dl, dr = FENCE_DEFAULT.get(t.selector, ('(', ')'))
        codes = [FENCE_CHAR.get(c.code) for c in chars]
        codes = [c for c in codes if c]
        var = t.variation
        has_l = bool(var & 0x0001) if t.selector != 9 else True
        has_r = bool(var & 0x0002) if t.selector != 9 else True
        if t.selector == 9:
            if len(codes) >= 2:
                dl, dr = codes[0], codes[1]
            else:
                lp = {0x0000: '(', 0x0001: '[', 0x0002: ']', 0x0003: ')'}
                # biến thể khoảng: bit 0-1 trái, 4-5 phải
                dl = {0: '(', 1: '[', 2: ']', 3: ')'}.get(var & 0x03, '(')
                dr = {0: ')', 1: ']', 2: '[', 3: '('}.get((var >> 4) & 0x03, ')')
            return dl, dr
        if var & 0x0003 == 0:
            has_l = has_r = True
        if has_l and has_r and len(codes) >= 2:
            dl, dr = codes[0], codes[1]
        elif has_l and not has_r and codes:
            dl = codes[0]
        elif has_r and not has_l and codes:
            dr = codes[-1]
        return (dl if has_l else '.'), (dr if has_r else '.')

    def tmpl(self, t):
        sel = t.selector
        var = t.variation
        lines = [x for x in t.items if isinstance(x, (Line, Pile, Matrix))]
        chars = [x for x in t.items if isinstance(x, Char)]
        L = [self.line(x) if isinstance(x, Line) else (self.pile(x) if isinstance(x, Pile) else self.matrix(x))
             for x in lines]

        def slot(k):
            return L[k] if k < len(L) else ''

        if sel <= 9:
            dl, dr = self.fence_pair(t, chars)
            body = slot(0)
            return r'\left' + dl + ' ' + body + r' \right' + dr
        if sel == 10:
            if var & 0x0001 and slot(1):
                return r'\sqrt[' + slot(1) + ']{' + slot(0) + '}'
            return r'\sqrt{' + slot(0) + '}'
        if sel == 11:
            if var & 0x0002 or var & 0x0004:
                return '{' + slot(0) + '}/{' + slot(1) + '}'
            return r'\frac{' + slot(0) + '}{' + slot(1) + '}'
        if sel == 12:
            return r'\underline{' + slot(0) + '}'
        if sel == 13:
            return r'\overline{' + slot(0) + '}'
        if sel == 14:
            top, bot = slot(0), slot(1)
            cmd = r'\xrightarrow'
            if var & 0x0010 and var & 0x0020:
                cmd = r'\xleftrightarrow'
            elif var & 0x0010:
                cmd = r'\xleftarrow'
            if var & 0x0001:
                cmd = r'\xRightarrow' if cmd == r'\xrightarrow' else (r'\xLeftarrow' if cmd == r'\xleftarrow' else r'\xLeftrightarrow')
            return cmd + ('[' + bot + ']' if bot else '') + '{' + top + '}'
        if 15 <= sel <= 22:
            op = BIGOP_DEFAULT[sel]
            if chars:
                op_l = char_to_latex(chars[-1].code)
                if op_l.startswith('\\'):
                    op = op_l
            if sel == 15:
                n_int = var & 0x0003
                op = {1: r'\int', 2: r'\iint', 3: r'\iiint'}.get(n_int, r'\int')
                if var & 0x0004:
                    op = r'\oint'
            main, lower, upper = slot(0), slot(1), slot(2)
            s = op
            if lower:
                s += '_{' + lower + '}'
            if upper:
                s += '^{' + upper + '}'
            return s + ' ' + main
        if sel == 23:
            main, lower, upper = slot(0), slot(1), slot(2)
            m = main.strip()
            if m in (r'\lim', r'\max', r'\min', r'\sup', r'\inf', r'\limsup', r'\liminf'):
                s = m
            else:
                s = r'\mathop{' + m + r'}\limits'
            if lower:
                s += '_{' + lower + '}'
            if upper:
                s += '^{' + upper + '}'
            return s
        if sel == 24:
            if var & 0x0001:
                return r'\overbrace{' + slot(0) + '}' + ('^{' + slot(1) + '}' if slot(1) else '')
            return r'\underbrace{' + slot(0) + '}' + ('_{' + slot(1) + '}' if slot(1) else '')
        if sel == 25:
            if var & 0x0001:
                return r'\overbrace{' + slot(0) + '}' + ('^{' + slot(1) + '}' if slot(1) else '')
            return r'\underbrace{' + slot(0) + '}' + ('_{' + slot(1) + '}' if slot(1) else '')
        if sel == 26:
            return slot(1) + r'\overline{\left)' + slot(0) + r'\right.}'
        if sel == 30:
            body = slot(0)
            if var & 0x0004:
                if var & 0x0001 and var & 0x0002:
                    return r'\underleftrightarrow{' + body + '}'
                if var & 0x0001:
                    return r'\underleftarrow{' + body + '}'
                return r'\underrightarrow{' + body + '}'
            if var & 0x0008:
                return (r'\overleftharpoon{' if var & 0x0001 and not var & 0x0002 else r'\overrightharpoon{') + body + '}'
            if var & 0x0001 and var & 0x0002:
                return r'\overleftrightarrow{' + body + '}'
            if var & 0x0001:
                return r'\overleftarrow{' + body + '}'
            return r'\overrightarrow{' + body + '}'
        if sel == 31:
            return r'\widetilde{' + slot(0) + '}'
        if sel == 32:
            return r'\widehat{' + slot(0) + '}'
        if sel == 33:
            return r'\overset{\frown}{' + slot(0) + '}'
        if sel == 34:
            return slot(0)
        if sel == 35:
            return r'\cancel{' + slot(0) + '}'
        if sel == 36:
            return r'\boxed{' + slot(0) + '}'
        return ' '.join(x for x in L if x)

    def pile(self, p):
        rows = []
        for ln in p.lines:
            if isinstance(ln, Line):
                rows.append(self.line(ln))
            elif isinstance(ln, Pile):
                rows.append(self.pile(ln))
            elif isinstance(ln, Matrix):
                rows.append(self.matrix(ln))
            else:
                rows.append(self.items([ln]))
        if len(rows) == 1:
            return rows[0]
        align = {1: 'l', 2: 'c', 3: 'r'}.get(p.halign, 'l')
        return r'\begin{array}{' + align + '}' + r' \\[12pt] '.join(rows) + r'\end{array}'

    def matrix(self, m):
        cells = [x for x in m.items if isinstance(x, (Line, Pile, Matrix, Tmpl))]
        out_rows = []
        k = 0
        for _ in range(m.rows):
            row = []
            for _ in range(m.cols):
                if k < len(cells):
                    c = cells[k]
                    row.append(self.line(c) if isinstance(c, Line) else self.items([c]))
                else:
                    row.append('')
                k += 1
            out_rows.append(' & '.join(row))
        cols = 'c' * max(1, m.cols)
        return r'\begin{array}{' + cols + '}' + r' \\[12pt] '.join(out_rows) + r'\end{array}'


def tidy(latex):
    s = latex.strip()
    s = re.sub(r'\s+', ' ', s)
    s = s.replace(r'\left. \right.', '')
    # loại nhóm rỗng thừa
    s = re.sub(r'\^\{\}', '', s)
    s = re.sub(r'_\{\}', '', s)
    s = s.replace('{}{}', '{}')
    return s.strip()


def mtef_to_latex(mtef):
    if not mtef:
        return ''
    if mtef[0] == 5:
        items = ParserV5(mtef).parse()
    elif mtef[0] == 3:
        items = ParserV3(mtef).parse()
    else:
        raise ValueError('unsupported MTEF version %d' % mtef[0])
    w = LatexWriter()
    eq_nodes = [x for x in items if isinstance(x, (Line, Pile, Matrix, Tmpl, Char))]
    return tidy(w.items(eq_nodes))


def ole_to_latex(ole_bytes):
    """Trả về chuỗi LaTeX chuẩn xác từ dữ liệu OLE nhúng. Trả về rỗng nếu không đọc được."""
    try:
        ole = olefile.OleFileIO(io.BytesIO(ole_bytes))
        if not ole.exists('Equation Native'):
            return ''
        native = ole.openstream('Equation Native').read()
        if len(native) < 2:
            return ''
        hdr = struct.unpack('<H', native[:2])[0]
        if hdr >= len(native):
            return ''
        res = mtef_to_latex(native[hdr:])
        return res if res else ''
    except Exception:
        return ''

