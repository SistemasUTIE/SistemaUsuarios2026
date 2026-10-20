import logoIeen from '../assets/IEEN300.png'

const color = {
  ink: [29, 54, 60],
  teal: [135, 65, 119],
  muted: [94, 112, 116],
  line: [211, 224, 225],
  pale: [239, 247, 247],
  warning: [161, 83, 38],
}

const urlAcceso = import.meta.env.QCLI_USER_ACCESS_URL

function fechaActual() {
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'long',
  }).format(new Date())
}

function textoSeguro(valor) {
  return String(valor || '').trim() || 'No especificado'
}

function ajustarUnaLinea(doc, valor, ancho) {
  let texto = String(valor)
  if (doc.getTextWidth(texto) <= ancho) return texto

  while (texto.length && doc.getTextWidth(`${texto}...`) > ancho) {
    texto = texto.slice(0, -1)
  }

  return `${texto}...`
}

function dibujarCampo(doc, etiqueta, valor, y, opciones = {}) {
  const { x = 22, ancho = 172, secreto = false } = opciones
  doc.setDrawColor(...color.line)
  doc.line(x, y + 11, x + ancho, y + 11)
  doc.setTextColor(...color.muted)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(etiqueta.toUpperCase(), x, y)
  doc.setTextColor(...color.ink)
  doc.setFont('helvetica', secreto ? 'bold' : 'normal')
  doc.setFontSize(secreto ? 12 : 10)
  doc.text(ajustarUnaLinea(doc, valor, ancho), x, y + 8)
}

async function cargarLogoDataUrl() {
  const response = await fetch(logoIeen)
  if (!response.ok) throw new Error('No se pudo cargar el logo institucional.')
  const blob = await response.blob()

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('No se pudo preparar el logo institucional.'))
    reader.readAsDataURL(blob)
  })
}

export async function descargarAcuseUsuario({
  nombre,
  userName,
  password,
}) {
  if (!urlAcceso) {
    throw new Error('Configura QCLI_USER_ACCESS_URL en el archivo .env.')
  }

  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
  const passwordDisponible = Boolean(password)
  const logoDataUrl = await cargarLogoDataUrl()
  const logoAncho = 46
  const logoAlto = logoAncho / (1227 / 687)

  doc.addImage(logoDataUrl, 'PNG', 16, 8, logoAncho, logoAlto)

  doc.setTextColor(...color.ink)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('Comprobante de entrega de cuenta', 198, 20, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...color.muted)
  doc.text(`Fecha: ${fechaActual()}`, 198, 27, { align: 'right' })

  doc.setFillColor(...color.pale)
  doc.roundedRect(16, 43, 184, 56, 2, 2, 'F')
  doc.setTextColor(...color.teal)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('ACUSE DE RECIBO', 22, 52)
  doc.setTextColor(...color.ink)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const textoAcuse = doc.splitTextToSize(
    passwordDisponible
      ? `Confirmo que recibí los datos de acceso de ${textoSeguro(nombre)} para la cuenta ${textoSeguro(userName)}. Me comprometo a mantener la contraseña bajo resguardo y cambiarla al ingresar por primera vez.`
      : `Se genera este comprobante para la cuenta ${textoSeguro(userName)} a nombre de ${textoSeguro(nombre)}. La contraseña no se incluye porque no se puede consultar una vez creada.`,
    170,
  )
  doc.text(textoAcuse, 22, 60)
  doc.setDrawColor(...color.muted)
  doc.line(22, 84, 112, 84)
  doc.setTextColor(...color.muted)
  doc.setFontSize(8)
  doc.text('Nombre y firma de quien recibe', 22, 89)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...color.muted)
  doc.text(
    [
      'Le informamos que la Unidad Técnica de Informática y Estadística, así como las demás áreas del Instituto',
      'nunca le solicitarán su contraseña por teléfono o por correo electrónico.',
      'Ratifico entender y acepto las políticas de uso de la cuenta de acceso al sistema asignado.',
    ],
    108,
    99,
    { align: 'center', lineHeightFactor: 1.25 },
  )

  doc.setDrawColor(...color.line)
  doc.setLineDashPattern([2, 2], 0)
  doc.line(10, 119, 206, 119)
  doc.setLineDashPattern([], 0)
  doc.setTextColor(...color.muted)
  doc.setFontSize(7)
  doc.text('RECORTAR POR ESTA LÍNEA', 108, 117, { align: 'center' })

  doc.addImage(logoDataUrl, 'PNG', 16, 126, logoAncho, logoAlto)
  doc.setTextColor(...color.ink)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Credenciales de acceso', 198, 142, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...color.muted)
  doc.text(`Fecha: ${fechaActual()}`, 198, 149, { align: 'right' })

  doc.setFillColor(...color.pale)
  doc.roundedRect(16, 158, 184, 67, 2, 2, 'F')
  dibujarCampo(doc, 'Nombre del empleado', textoSeguro(nombre), 169)
  dibujarCampo(doc, 'Nombre de usuario', textoSeguro(userName), 189)
  dibujarCampo(
    doc,
    passwordDisponible ? 'Contraseña temporal' : 'Contraseña',
    passwordDisponible ? password : 'No disponible por seguridad',
    209,
    { secreto: passwordDisponible },
  )

  doc.setTextColor(...color.teal)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('Dirección de acceso', 22, 230)
  doc.setTextColor(...color.ink)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(urlAcceso, 22, 235)

  doc.setFillColor(252, 245, 235)
  doc.roundedRect(16, 240, 184, 35, 2, 2, 'F')
  doc.setTextColor(...color.warning)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('Información confidencial', 21, 247)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  const textoConfidencial = doc.splitTextToSize(
    [
      'Para realizar el cambio de contraseña:',
      'Le informamos que la Unidad Técnica de Informática y Estadística, así como las demás áreas del Instituto',
      'nunca le solicitarán su contraseña por teléfono o por correo electrónico.',
      'Ratifico entender y acepto las políticas de uso de la cuenta de acceso al sistema asignado.',
    ].join(' '),
    174,
  )
  doc.text(textoConfidencial, 21, 252, { lineHeightFactor: 1.15 })

  const nombreArchivo = textoSeguro(userName)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
  doc.save(`acuse_${nombreArchivo}.pdf`)
}
