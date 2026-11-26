import re, sys
src = open(sys.argv[1]).read()

def bloque(nombre):
    m = re.search(r'^(function ' + nombre + r'\b|const ' + nombre + r'\b)', src, re.M)
    if not m: raise SystemExit('falta ' + nombre)
    i = m.start()
    if src[i:].startswith('function'):
        j = src.index('{', i); depth = 0; k = j
        while True:
            ch = src[k]
            if ch == '{': depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0: return src[i:k+1]
            k += 1
    linea_fin = src.index('\n', i)
    seg = src[i:linea_fin]
    if seg.rstrip().endswith('{'):
        j = src.index('{', i); depth = 0; k = j
        while True:
            ch = src[k]
            if ch == '{': depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0: return src[i:src.index(';', k) + 1]
            k += 1
    return seg

ins = bloque('INSUMOS')
ins = re.sub(r"ico: '[^']*',\s*", '', ins)
partes = [ins] + [bloque(n) for n in ['ORDEN', 'nf', 'fmt', 'pct', 'dn', 'isoDn', 'sumar', 'mediana', 'construirModelo', 'consumoMedio', 'ingresosNetos', 'ingresoNetoPeriodo', 'unidadesPedido', 'redondearPedido', 'cantidadPedido', 'normCdf', 'proyeccion', 'sigmaConsumo', 'zNormal', 'teorico']]
cuerpo = '\n\n'.join(partes)
out = "const MOD_ = (function () {\n  const ST = { datos: null };\n" + cuerpo + "\n\n  function modelo(D) { ST.datos = D; return construirModelo(D); }\n  return { INSUMOS, ORDEN, fmt, pct, dn, isoDn, sumar, modelo, ingresoNetoPeriodo, cantidadPedido, proyeccion, teorico, unidadesPedido };\n})();\n"
open(sys.argv[2], 'w').write(out)
