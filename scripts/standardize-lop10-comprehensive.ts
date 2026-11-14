import { db } from '../src/lib/db'

function cleanMathExpression(expr: string): string {
  let e = expr.trim()
  e = e.replace(/\s*([=<>])\s*/g, ' $1 ')
  e = e.replace(/\s*\\(le|ge|ne|leq|geq|neq|in|notin|subset|cap|cup|pm|times|approx|equiv)\s*/g, ' \\$1 ')
  e = e.replace(/\s*\+\s*/g, ' + ')
  e = e.replace(/\s*-\s*/g, ' - ')
  e = e.replace(/\s*;\s*/g, '; ')
  e = e.replace(/\s{2,}/g, ' ').trim()
  return e
}

export function standardizeQuestionText(text: string): string {
  if (!text) return ''
  let s = text

  // 1. Dọn dẹp ký tự điều khiển font scan và unicode rác
  s = s
    .replace(/[\u0000\u0010]/g, '(')
    .replace(/[\u0001\u0011]/g, ')')
    .replace(/\u0008/g, '{')
    .replace(/[\u0002-\u0007\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/\u2212/g, '-')
    .replace(/\\np(?=["\s,;]|$)/gi, '')
    .replace(/\s*\\np\s*$/gi, '')
    .replace(/\.\s*p$/gi, '.')

  // 2. Chuyển đổi hệ phương trình / hệ bất phương trình ký tự Unicode hộp [] sang \begin{cases}
  s = s.replace(
    /[\u23A7][\s\S]*?[\u23A9]\s*([\s\S]*?)(?=(?:không chứa|chứa điểm|là|tại điểm|thỏa mãn|\?|$))/g,
    (match, inner) => {
      const lines = inner
        .split('\n')
        .map((l: string) => l.trim())
        .filter((l: string) => l.length > 0 && /[=<>≤≥]/.test(l))
        .map((l: string) => cleanMathExpression(l.replace(/≤/g, '\\le ').replace(/≥/g, '\\ge ')))
      if (lines.length > 0) {
        return `$\\begin{cases} ${lines.join(' \\\\ ')} \\end{cases}$ `
      }
      return match
    }
  )

  // 3. Sửa lỗi OCR quét đặc trưng (b2̸, a̸, », #)
  s = s.replace(/a\^2\s*\+\s*b2̸\s*=\s*0/g, 'a^2 + b^2 \\ne 0')
  s = s.replace(/\(a\^2\s*\+\s*b2̸\s*=\s*0\s*\)/g, '(a^2 + b^2 \\ne 0)')
  s = s.replace(/b2̸\s*=\s*0/g, 'b^2 \\ne 0')
  s = s.replace(/a̸\s*=\s*0/g, 'a \\ne 0')
  s = s.replace(/\(a̸\s*=\s*0\)/g, '(a \\ne 0)')
  s = s.replace(/#\s*»\s*\n?\s*v([0-9]+)/gi, '\\vec{v}_{$1}')
  s = s.replace(/#\s*»\s*\n?\s*([A-Z]{2})/g, '\\vec{$1}')
  s = s.replace(/#\s*»\s*([A-Z]{2})/g, '\\vec{$1}')
  s = s.replace(/#\s*»\s*\n?\s*([a-z0-9])/gi, '\\vec{$1}')
  s = s.replace(/#\s*»\s*([a-z0-9])/gi, '\\vec{$1}')

  // Sửa lỗi OCR số mũ bị mất dấu ^: 2x2 + 3x -> 2x^2 + 3x, ax2 + bx -> ax^2 + bx, π2 -> \pi^2
  s = s.replace(/(\b[a-zA-Z])2(?=\s*[\+\-\*=<>,\)])/g, '$1^2')
  s = s.replace(/([0-9]+[a-zA-Z])2(?=\s*[\+\-\*=<>,\)])/g, '$1^2')
  s = s.replace(/π2/g, '\\pi^2')

  // 4. Tách từ tiếng Việt bị dính (OCR word boundary fixes)
  const wordPairs: [RegExp, string][] = [
    [/tọa độOxy/g, 'tọa độ Oxy'],
    [/hệ trục tọa độOxy/g, 'hệ trục tọa độ Oxy'],
    [/mặt phẳng tọa độOxy/g, 'mặt phẳng tọa độ Oxy'],
    [/hệ tọa độOxy/g, 'hệ tọa độ Oxy'],
    [/trục tọa độOxy/g, 'trục tọa độ Oxy'],
    [/tọa độlà/g, 'tọa độ là'],
    [/tọa độcủa/g, 'tọa độ của'],
    [/tọađộ/g, 'tọa độ'],
    [/toạđộ/g, 'tọa độ'],
    [/hệbất/g, 'hệ bất'],
    [/bấtphương/g, 'bất phương'],
    [/phươngtrình/g, 'phương trình'],
    [/hệ sốa,b,\s*c/g, 'hệ số a, b, c'],
    [/hệ sốa,\s*b/g, 'hệ số a, b'],
    [/hệ sốa/g, 'hệ số a'],
    [/hệsố/g, 'hệ số'],
    [/mệnh đềphủ/g, 'mệnh đề phủ'],
    [/mệnh đềđúng/g, 'mệnh đề đúng'],
    [/mệnh đềsai/g, 'mệnh đề sai'],
    [/mệnh đềsau/g, 'mệnh đề sau'],
    [/mệnh đềnào/g, 'mệnh đề nào'],
    [/mệnh đềtrên/g, 'mệnh đề trên'],
    [/mệnh đềnày/g, 'mệnh đề này'],
    [/mệnhđề/g, 'mệnh đề'],
    [/Phủđịnh/g, 'Phủ định'],
    [/phủđịnh/g, 'phủ định'],
    [/đểmệnh đề/g, 'để mệnh đề'],
    [/sẽlà/g, 'sẽ là'],
    [/chăm chỉthì/g, 'chăm chỉ thì'],
    [/giá trịnào/g, 'giá trị nào'],
    [/giátrị/g, 'giá trị'],
    [/sốvô tỷ/g, 'số vô tỷ'],
    [/vô tỷlà/g, 'vô tỷ là'],
    [/sốthập phân/g, 'số thập phân'],
    [/sốchính phương/g, 'số chính phương'],
    [/sốhữu tỷ/g, 'số hữu tỷ'],
    [/sốthực/g, 'số thực'],
    [/đồngthời/g, 'đồng thời'],
    [/khác0\b/g, 'khác 0'],
    [/bằng0\b/g, 'bằng 0'],
    [/độdài/g, 'độ dài'],
    [/tamgiác/g, 'tam giác'],
    [/haiđiểm/g, 'hai điểm'],
    [/bađiểm/g, 'ba điểm'],
    [/thỏamãn/g, 'thỏa mãn'],
    [/khônggian/g, 'không gian'],
    [/mặtphẳng/g, 'mặt phẳng'],
    [/tậphợp/g, 'tập hợp'],
    [/nghiệmcủa/g, 'nghiệm của'],
    [/vớimọi/g, 'với mọi'],
    [/tồntại/g, 'tồn tại'],
    [/điềukiện/g, 'điều kiện'],
    [/khẳngđịnh/g, 'khẳng định'],
    [/khảng định/g, 'khẳng định'],
  ]

  for (const [re, rep] of wordPairs) {
    s = s.replace(re, rep)
  }

  // Tách từ nối dính chữ thường: đểx, đểa, đểmệnh
  s = s.replace(/\bđể([a-zà-ỹ])/g, 'để $1')
  s = s.replace(/\bthì([a-zà-ỹ])/g, 'thì $1')
  s = s.replace(/(\b60\^\{\\circ\})thì/g, '$1 thì')

  // 5. Ký hiệu toán học Unicode -> LaTeX
  s = s.replace(/≤/g, '\\le ')
  s = s.replace(/≥/g, '\\ge ')
  s = s.replace(/≠/g, '\\ne ')
  s = s.replace(/∀\s*([a-zA-Z])\s*∈\s*R\b/g, '\\forall $1 \\in \\mathbb{R}')
  s = s.replace(/∃\s*([a-zA-Z])\s*∈\s*R\b/g, '\\exists $1 \\in \\mathbb{R}')
  s = s.replace(/∀\s*([a-zA-Z])\s*∈\s*N\b/g, '\\forall $1 \\in \\mathbb{N}')
  s = s.replace(/∃\s*([a-zA-Z])\s*∈\s*N\b/g, '\\exists $1 \\in \\mathbb{N}')
  s = s.replace(/∀\s*([a-zA-Z])\s*∈\s*Z\b/g, '\\forall $1 \\in \\mathbb{Z}')
  s = s.replace(/∃\s*([a-zA-Z])\s*∈\s*Z\b/g, '\\exists $1 \\in \\mathbb{Z}')
  s = s.replace(/∀\s*([a-zA-Z])\s*∈\s*Q\b/g, '\\forall $1 \\in \\mathbb{Q}')
  s = s.replace(/∃\s*([a-zA-Z])\s*∈\s*Q\b/g, '\\exists $1 \\in \\mathbb{Q}')
  s = s.replace(/∈\s*R\b/g, '\\in \\mathbb{R}')
  s = s.replace(/∈\s*N\b/g, '\\in \\mathbb{N}')
  s = s.replace(/∈\s*Z\b/g, '\\in \\mathbb{Z}')
  s = s.replace(/∈\s*Q\b/g, '\\in \\mathbb{Q}')
  s = s.replace(/∈/g, '\\in')
  s = s.replace(/∉/g, '\\notin')
  s = s.replace(/∀/g, '\\forall ')
  s = s.replace(/∃/g, '\\exists ')
  s = s.replace(/⇒/g, ' \\Rightarrow ')
  s = s.replace(/⇔/g, ' \\Leftrightarrow ')
  s = s.replace(/±/g, '\\pm ')
  s = s.replace(/π/g, '\\pi')

  // Đưa dấu nháy kép ra ngoài $: $“... ”$ -> “$...$”
  s = s.replace(/\$\s*[“"']\s*([^”"']+?)\s*[”"']\s*\$/g, '“$$$1$$”')

  // Bọc quantifier khi đứng độc lập: Mệnh đề \forall x \in \mathbb{R}, x^2 ...
  s = s.replace(
    /(?:(?<=[\s,;:\(\[\{])|^)(\\(?:forall|exists)\s+[a-zA-Z0-9_\^\\\s,\{\}\(\)]+?[=<>\\le\\ge\\in][a-zA-Z0-9_\^\\\s,\{\}\(\)\+\-\*\/]+?)(?=[\s,;:\)\]\}\.]|$)/g,
    (m, expr) => {
      const trimmed = expr.trim()
      if (!/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(trimmed)) {
        return ` $${cleanMathExpression(trimmed)}$ `
      }
      return m
    }
  )

  // 6. Sửa lỗi $ vụn
  s = s.replace(/\$\s*\\vec\{([a-zA-Z0-9]+)\}\s*=\s*[\$]?\s*\\vec\{([a-zA-Z0-9]+)\}\s*[\$]?/g, '$\\vec{$1} = \\vec{$2}$')
  s = s.replace(/\$\s*\\vec\{([a-zA-Z0-9]+)\}\s*=\s*-\s*[\$]?\s*\\vec\{([a-zA-Z0-9]+)\}\s*[\$]?/g, '$\\vec{$1} = -\\vec{$2}$')
  s = s.replace(/\$\s*\\vec\{([a-zA-Z0-9]+)\}\s*\$/g, '\\vec{$1}')
  s = s.replace(/=\s*\$\s*\\vec\{/g, '= \\vec{')
  s = s.replace(/=\s*-\s*\$\s*\\vec\{/g, '= -\\vec{')
  s = s.replace(
    /\$\\vec\{([a-z])\}\s*=\s*([0-9\-]+)\s*\\vec\{([a-z])\}\s*([0-9\+\-]+)\s*\\vec\{([a-z])\}\s*bằng\$/gi,
    '$\\vec{$1} = $2\\vec{$3} $4\\vec{$5}$ bằng'
  )
  s = s.replace(
    /\$\\vec\{([a-z])\}\s*=\s*([0-9\-]+)\s*\$\\vec\{([a-z])\}\$\s*([0-9\+\-]+)\s*\$\\vec\{([a-z])\}\$\s*bằng\$/gi,
    '$\\vec{$1} = $2\\vec{$3} $4\\vec{$5}$ bằng'
  )
  s = s.replace(/\$M\(0;\s*-\s*\$\\frac\{1\}\{2\}\$\)\$\./g, '$M\\left(0; -\\frac{1}{2}\\right)$.')
  s = s.replace(/\$\\vec\{([a-zA-Z0-9]+)\}\$\s*[·•]\s*\$\\vec\{([a-zA-Z0-9]+)\}\$/g, '$\\vec{$1} \\cdot \\vec{$2}$')
  s = s.replace(/\\vec\{([a-zA-Z0-9]+)\}\s*[·•]\s*\\vec\{([a-zA-Z0-9]+)\}/g, '\\vec{$1} \\cdot \\vec{$2}')

  // 7. Xử lý phần nằm ngoài $...$ và $$...$$
  const parts = s.split(/(\$\$[\s\S]*?\$\$|\$[^$]*?\$)/g)

  for (let i = 0; i < parts.length; i += 2) {
    let p = parts[i]
    if (!p) continue

    // Tọa độ điểm dạng M(1; \frac{3}{2}), P(-1; \frac{3}{2})
    p = p.replace(/\b([A-Z]\s*\(\s*[^)]*\\(?:frac|sqrt)[^)]*\))/g, (m) => {
      let inside = m.replace(/;\s*/g, '; ')
      inside = inside.replace(/\((.*)\)/, '\\left($1\\right)')
      return `$${inside}$`
    })

    // Tọa độ số chuẩn dạng Q(-1; -3), N(1; 1), A(1; 3)
    p = p.replace(
      /(^|[\s(])([A-Z]\s*\(\s*[-+]?\d+(?:\.\d+)?\s*;\s*[-+]?\d+(?:\.\d+)?\s*\))([\s,\.\)]|$)/g,
      '$1$$$2$$$3'
    )

    // Bọc phương trình / bất phương trình chứa \le, \ge, \ne:
    // Ví dụ: ax+ by \le c, a \ge b, a^2 \ge b^2, a^2 + b^2 \ne 0
    p = p.replace(
      /(?:(?<=[\s,;:\(\[\{])|^)([a-zA-Z0-9_\^]+(?:\s*[\+\-\*\/]\s*[a-zA-Z0-9_\^]+)*\s*\\(?:le|ge|ne|leq|geq|neq)\s*[a-zA-Z0-9_\^]+(?:\s*[\+\-\*\/]\s*[a-zA-Z0-9_\^]+)*)(?=[\s,;:\)\]\}\.]|$)/g,
      (match, expr) => {
        const trimmed = expr.trim()
        if (
          trimmed &&
          !/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(trimmed)
        ) {
          return ` $${cleanMathExpression(trimmed)}$ `
        }
        return match
      }
    )

    // Phương trình / bất phương trình với =, <, >:
    // Ví dụ: 2x -3y + 1 < 0, 2x-3y+1 = 0, x^2 -1 = 0, x^2 + 7x - 2 = 0
    p = p.replace(
      /(?:(?<=[\s,;:\(\[\{])|^)([a-zA-Z0-9_\^]+(?:\s*[\+\-\*\/]\s*[a-zA-Z0-9_\^]+)*\s*[=<>]\s*[-+]?[a-zA-Z0-9_\^]+(?:\s*[\+\-\*\/]\s*[a-zA-Z0-9_\^]+)*)(?=[\s,;:\)\]\}\.]|$)/g,
      (match, expr) => {
        const trimmed = expr.trim()
        if (
          trimmed &&
          !/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(trimmed)
        ) {
          if (/[a-zA-Z]/.test(trimmed)) {
            return ` $${cleanMathExpression(trimmed)}$ `
          }
        }
        return match
      }
    )

    // Bọc góc độ: 60^{\circ} -> $60^\circ$
    p = p.replace(/([0-9]+)\s*\^\{\s*\\circ\s*\}/g, '$$$1^\\circ$$')

    // Bọc biến trong các mệnh đề: a và b không đồng thời bằng 0
    p = p.replace(/\bhệ số\s+a,\s*b,\s*c\b/g, 'hệ số $a, b, c$')
    p = p.replace(/\bhệ số\s+a,\s*b\b/g, 'hệ số $a, b$')
    p = p.replace(/\ba và b không đồng thời bằng 0\b/g, '$a$ và $b$ không đồng thời bằng $0$')

    // Bọc các lệnh LaTeX độc lập còn sót ngoài $: \frac, \sqrt, \vec
    p = p.replace(/(\\(?:frac\{[^{}]*\}\{[^{}]*\}|sqrt\{[^{}]*\}|vec\{[^{}]*\}))/g, '$$$1$$')

    // Bọc tập hợp dạng A = {x | ...} hoặc X = {1; 2; 3}
    p = p.replace(/(^|[\s(])([A-Z]\s*=\s*\{[^\}]+\})([\s,\.\)]|$)/g, '$1$$$2$$$3')

    parts[i] = p
  }

  let res = parts.join('')

  // 8. Dọn khoảng trắng thừa quanh $
  res = res.replace(/\s{2,}/g, ' ')
  res = res.replace(/\(\s*\$/g, '($')
  res = res.replace(/\$\s*\)/g, '$)')
  res = res.replace(/\$\s+([,;\.])/g, '$$$1')
  res = res.replace(/\$\s*,\s*\$/g, ', ')

  // Dọn $ lồng nhau: $$a + b$$ -> $a + b$
  res = res.replace(/(?<!\$)\$\$([^\$]+?)\$\$(?!\$)/g, '$$$1$$')
  res = res.replace(/\${3,}/g, '$$')

  return res.trim()
}

async function main() {
  console.log('=== TIẾN HÀNH DÀ SOÁT VÀ CHUẨN HÓA TOÀN BỘ CÂU HỎI LỚP 10 ===\n')

  const questions = await db.baiTap.findMany({
    where: {
      chuDe: {
        chuong: {
          lop: { ten: { contains: '10' } },
        },
      },
    },
    select: {
      id: true,
      deBai: true,
      dapAn: true,
      loiGiaiChiTiet: true,
      chuDe: { select: { ten: true } },
    },
  })

  console.log(`Tổng số câu hỏi Lớp 10 cần rà soát: ${questions.length}`)

  let updatedCount = 0

  for (const q of questions) {
    const cleanedDe = standardizeQuestionText(q.deBai)
    const cleanedSol = q.loiGiaiChiTiet ? standardizeQuestionText(q.loiGiaiChiTiet) : q.loiGiaiChiTiet

    let parsed: any = {}
    try {
      parsed = JSON.parse(q.dapAn)
    } catch {
      parsed = { dapAnDung: 'A', cacLuaChon: {} }
    }

    const cleanOpts: Record<string, string> = {}
    let optsChanged = false

    for (const [k, v] of Object.entries(parsed.cacLuaChon || {})) {
      const cleanedVal = standardizeQuestionText(v as string)
      cleanOpts[k] = cleanedVal
      if (cleanedVal !== v) {
        optsChanged = true
      }
    }

    const deChanged = cleanedDe !== q.deBai
    const solChanged = cleanedSol !== q.loiGiaiChiTiet

    if (deChanged || optsChanged || solChanged) {
      parsed.cacLuaChon = cleanOpts
      await db.baiTap.update({
        where: { id: q.id },
        data: {
          deBai: cleanedDe,
          dapAn: JSON.stringify(parsed),
          loiGiaiChiTiet: cleanedSol,
        },
      })
      updatedCount++
    }
  }

  console.log(`\n✓ Hoàn tất cập nhật: Đã chuẩn hóa ${updatedCount} / ${questions.length} câu hỏi Lớp 10!`)

  // Kiểm tra lại câu hỏi trong ảnh của người dùng
  const testQ = await db.baiTap.findUnique({ where: { id: 'bt-lop10-b3-q01' } })
  console.log('\n--- Kiểm tra lại câu trong ảnh người dùng (bt-lop10-b3-q01): ---')
  console.log('Đề bài:', testQ?.deBai)
  console.log('Đáp án:', testQ?.dapAn)
}

main()
  .catch((e) => {
    console.error('Lỗi khi chuẩn hóa:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
