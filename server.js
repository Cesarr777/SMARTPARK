// =====================
// IMPORTS ÚNICOS
// =====================
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const Joi = require('joi');
const stripe = require('stripe')('sk_test_51RPASTPRHCxOJyDT33E5wdSWXpTe9N9p4IXRJPGIKH0O8liQ5V2LpJMtFsAULKu5YeuJlZtryOErS32lnLhCrzVh00heR4zBTt');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// =====================
// INSTANCIAS PRINCIPALES
// =====================
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// =====================
// MIDDLEWARES ÚNICOS
// =====================
app.use(express.json());
app.use(cors({ origin: '*' }));

// =====================
// SOCKETS Y ESTADO EN TIEMPO REAL
// =====================
let ultimoEstado = [];
let usuariosConectados = {}; // { usuario: { socketId, nombre, cajon, placas } }

io.on("connection", (socket) => {
  console.log("📲 Cliente conectado:", socket.id);
  socket.emit("message", JSON.stringify(ultimoEstado));

  // Login de usuario para chat
  socket.on('loginUsuario', (data) => {
    const { usuario, placas, cajon } = data;
    if (!usuariosConectados[usuario]) {
      usuariosConectados[usuario] = {
        socketId: socket.id,
        nombre: usuario,
        placas: placas || '',
        cajon: cajon || '',
      };
    } else {
      usuariosConectados[usuario].socketId = socket.id;
      if (placas !== undefined) usuariosConectados[usuario].placas = placas;
      if (cajon !== undefined) usuariosConectados[usuario].cajon = cajon;
    }
    socket.usuario = usuario;
    io.emit('usuariosConectados', usuariosConectados);
  });

  // Usuario envía mensaje al guardia
  socket.on('enviarMensajeUsuario', (data) => {
    const { usuario, mensaje } = data;
    io.emit('recibirMensaje', { nombre: usuario, mensaje });
  });

  // Guardia envía mensaje a usuario específico
  socket.on('enviarMensajeGuardia', (data) => {
    const { usuario, mensaje } = data;
    const usuarioData = usuariosConectados[usuario];
    if (usuarioData && io.sockets.sockets.get(usuarioData.socketId)) {
      io.to(usuarioData.socketId).emit('recibirMensaje', {
        nombre: 'Guardia',
        mensaje,
        destinatario: usuario,
      });
    }
  });

  // Usuario indica que está escribiendo
  socket.on('usuarioEscribiendo', (data) => {
    const { usuario, escribiendo } = data;
    io.emit('usuarioEscribiendo', { usuario, escribiendo });
  });

  // Guardia indica que está escribiendo
  socket.on('guardiaEscribiendo', (escribiendo) => {
    io.emit('guardiaEscribiendo', escribiendo);
  });

  // Evento para notificar reservas a todos los guardias/app
  socket.on('nuevaReserva', (data) => {
    io.emit('reservaParaGuardia', data);
  });

  socket.on('disconnect', () => {
    if (socket.usuario && usuariosConectados[socket.usuario]) {
      delete usuariosConectados[socket.usuario];
    }
    io.emit('usuariosConectados', usuariosConectados);
  });
});

// =====================
// ENDPOINTS Y LÓGICA DE API
// =====================

// Actualizar estado en tiempo real (mapa, etc)
app.post("/actualizar", (req, res) => {
  ultimoEstado = req.body;
  io.emit("message", JSON.stringify(ultimoEstado));
  res.sendStatus(200);
});

// Obtener datos del recibo por email
app.get('/api/datos-recibo', async (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).json({ error: 'Falta email' });

  try {
    const pago = await PagoInfo.findOne({ correo: email }).sort({ fechaPago: -1 });
    if (!pago) return res.status(404).json({ error: 'No se encontró recibo para ese correo' });

    res.json({
      name: pago.nombre,
      email: pago.correo,
      plates: pago.placas,
      model: pago.modelo,
      plaza: pago.plaza || '',
      cajon: pago.cajon || '',
      fecha: pago.fechaPago,
      total: pago.total || '$696.00'
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al buscar los datos' });
  }
});

// Enviar recibo por correo (con PDF)
app.post('/api/enviar-recibo', async (req, res) => {
  const { name, email, plates, model, plaza, cajon } = req.body;
  const fecha = new Date().toLocaleString('es-MX', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  const numeroRecibo = `SP-${Date.now().toString().slice(-8)}`;
  const correoSeguro = email.replace(/[@.]/g, '_');
  const filename = `recibo_${correoSeguro}_${Date.now()}.pdf`;
  const filePath = path.join(__dirname, 'recibos', filename);

  if (!fs.existsSync(path.join(__dirname, 'recibos'))) {
    fs.mkdirSync(path.join(__dirname, 'recibos'), { recursive: true });
  }

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 }
  });

  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  const colorPrimario = '#0026A9';
  const colorSecundario = '#f2f2f2';
  const logoPath = path.join(__dirname, 'assets', 'logo.png');
  const crearEncabezado = (doc, texto, y) => {
    doc.fillColor(colorPrimario)
       .rect(50, y, 495, 25)
       .fill();
    doc.fillColor('white')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text(texto.toUpperCase(), 60, y + 7);
    return y + 25;
  };
  const crearLineaTabla = (doc, col1, col2, col3, col4, col5, y, esEncabezado = false) => {
    const anchoCol = [80, 200, 65, 65, 85];
    const x = [50, 130, 330, 395, 460];
    if (esEncabezado) {
      doc.fillColor(colorSecundario)
         .rect(50, y - 3, 495, 20)
         .fill();
      doc.fillColor(colorPrimario)
         .font('Helvetica-Bold');
    } else {
      doc.fillColor('black')
         .font('Helvetica');
    }
    doc.fontSize(10);
    doc.text(col1, x[0], y, { width: anchoCol[0], align: 'left' });
    doc.text(col2, x[1], y, { width: anchoCol[1], align: 'left' });
    doc.text(col3, x[2], y, { width: anchoCol[2], align: 'center' });
    doc.text(col4, x[3], y, { width: anchoCol[3], align: 'right' });
    doc.text(col5, x[4], y, { width: anchoCol[4], align: 'right' });
    return y + 20;
  };
  try {
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 50, { width: 150 });
    } else {
      doc.font('Helvetica-Bold').fontSize(24).fillColor(colorPrimario).text('SMARTPARK', 50, 50);
    }
  } catch (err) {
    doc.font('Helvetica-Bold').fontSize(24).fillColor(colorPrimario).text('SMARTPARK', 50, 50);
  }
  doc.font('Helvetica-Bold').fontSize(18).fillColor(colorPrimario).text('RECIBO DE RENTA DE CAJÓN', 280, 60, { align: 'right' });
  doc.fontSize(10).text(`Recibo #: ${numeroRecibo}`, 280, 85, { align: 'right' });
  doc.fontSize(10).text(`Fecha: ${fecha}`, 280, 100, { align: 'right' });

  let y = 130;
  y = crearEncabezado(doc, 'Información del Cliente', y);
  doc.fillColor('black').font('Helvetica').fontSize(10);
  doc.text(`Nombre: ${name}`, 60, y + 10);
  doc.text(`Correo: ${email}`, 60, y + 25);
  doc.text(`Vehículo: ${model}`, 60, y + 40);
  doc.text(`Placas: ${plates}`, 60, y + 55);
  doc.text(`Plaza: ${plaza}`, 60, y + 70);
  doc.text(`Cajón reservado: ${cajon}`, 60, y + 85);

  y = y + 100;
  y = crearEncabezado(doc, 'Detalles del Servicio', y);
  y = y + 10;
  y = crearLineaTabla(doc, 'CONCEPTO', 'DESCRIPCIÓN', 'CANTIDAD', 'PRECIO', 'TOTAL', y, true);
  y = crearLineaTabla(doc, 'RENT-001', 'Renta mensual de cajón de estacionamiento', '1', '$600.00', '$600.00', y);

  doc.moveTo(50, y + 10)
     .lineTo(545, y + 10)
     .strokeColor(colorPrimario)
     .lineWidth(1)
     .stroke();

  doc.font('Helvetica').fontSize(10).text('Subtotal:', 395, y + 20, { width: 65, align: 'right' });
  doc.text('$600.00', 460, y + 20, { width: 85, align: 'right' });
  doc.text('IVA (16%):', 395, y + 35, { width: 65, align: 'right' });
  doc.text('$96.00', 460, y + 35, { width: 85, align: 'right' });
  doc.rect(395, y + 50, 150, 1).fillColor(colorPrimario).fill();
  doc.font('Helvetica-Bold').text('TOTAL:', 395, y + 60, { width: 65, align: 'right' });
  doc.text('$696.00', 460, y + 60, { width: 85, align: 'right' });

  y = y + 100;
  y = crearEncabezado(doc, 'Condiciones y Métodos de Pago', y);

  doc.fillColor('black')
     .font('Helvetica')
     .fontSize(10)
     .text('• Vigencia: 30 días a partir de la fecha de emisión', 60, y + 10)
     .text('• Pago realizado mediante tarjeta bancaria', 60, y + 25)
     .text('• Conserve este recibo como comprobante de pago', 60, y + 40);

  doc.fontSize(9)
     .font('Helvetica')
     .text('Si tiene alguna duda sobre este recibo, por favor contáctenos en:', 50, 730, { align: 'center' })
     .font('Helvetica-Bold')
     .fillColor(colorPrimario)
     .text('smartparkreal@outlook.com | Tel: 664-709-2055', 50, 745, { align: 'center' });

  doc.fontSize(8)
     .fillColor('black')
     .font('Helvetica')
     .text('© 2025 SmartPark. Todos los derechos reservados.', 50, 760, { align: 'center' });

  doc.end();

  stream.on('finish', async () => {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'cesaralexis1290@gmail.com',
        pass: 'wqlvzmrnunexcnhp', // tu app password
      },
    });

    const mailOptions = {
      from: 'SMARTPARK <cesaralexis1290@gmail.com>',
      to: email,
      subject: 'Tu recibo de renta - SMARTPARK',
      text: `Hola ${name},\n\nGracias por confiar en SMARTPARK...`,
      attachments: [{ filename, path: filePath }],
    };

    try {
      await transporter.verify();
      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: 'Recibo enviado por correo correctamente' });
    } catch (error) {
      res.status(500).json({ message: 'Error al enviar el correo', error: error.message });
    }
  });

  stream.on('error', (err) => {
    res.status(500).json({ message: 'Error al generar el PDF', error: err.message });
  });
});

app.get('/api/recibos', async (req, res) => {
  try {
    const recibos = await PagoInfo.find().sort({ fechaPago: -1 }); // Ordena por fecha, el más nuevo primero
    res.json(recibos);
  } catch (err) {
    res.status(500).json({ error: 'No se pudieron obtener los recibos.' });
  }
});

// Verificar si existe recibo con el correo
app.get('/api/verificar-recibo', (req, res) => {
  const email = req.query.email;
  if (!email) return res.json({ exists: false });

  const correoSeguro = email.replace(/[@.]/g, '_');
  const recibosDir = path.join(__dirname, 'recibos');
  fs.readdir(recibosDir, (err, files) => {
    if (err) return res.json({ exists: false });
    const existe = files.some(name => name.startsWith(`recibo_${correoSeguro}_`));
    res.json({ exists: existe });
  });
});

// =====================
// MONGODB: CONEXIÓN Y MODELOS
// =====================
const uri = 'mongodb+srv://user:CspjnjmJ7QeC59HM@smartpark.crquenp.mongodb.net/?retryWrites=true&w=majority&appName=SMARTPARK';

mongoose.connect(uri)
  .then(() => console.log('Conectado a MongoDB Atlas'))
  .catch(error => {
    console.error('Error al conectar a MongoDB:', error);
    process.exit(1);
  });

mongoose.connection.on('connected', () => {
  console.log('Mongoose conectado a la base de datos');
});
mongoose.connection.on('error', (err) => {
  console.error('Error en la conexión de Mongoose:', err);
});
mongoose.connection.on('disconnected', () => {
  console.log('Mongoose desconectado');
});
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

// Modelo de Mensajes de Contacto
const mensajeSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  correo: { type: String, required: true },
  numero: { type: String, required: true },
  mensaje: { type: String, required: true },
  fecha: { type: Date, default: Date.now },
});
const Mensaje = mongoose.model('Mensaje', mensajeSchema);

const contactValidationSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  message: Joi.string().required(),
});

app.post('/api/contact', async (req, res) => {
  const { error } = contactValidationSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { name, email, phone, message } = req.body;

  try {
    const nuevoMensaje = new Mensaje({
      nombre: name,
      correo: email,
      numero: phone,
      mensaje: message,
    });

    await nuevoMensaje.save();
    res.status(200).json({ message: 'Mensaje enviado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al enviar el mensaje', error: error.message });
  }
});

// Modelo de Pagos Stripe
const pagoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  correo: { type: String, required: true },
  placas: { type: String, required: true },
  modelo: { type: String, required: true },
  plaza: { type: String, required: false },
  cajon: { type: String, required: false },
  total: { type: String, required: false },
  fechaPago: { type: Date, default: Date.now },
});
const PagoInfo = mongoose.model('PagoInfo', pagoSchema);

const pagoValidationSchema = Joi.object({
  paymentMethodId: Joi.string().required(),
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  plates: Joi.string().required(),
  model: Joi.string().required(),
  plaza: Joi.string().required(), 
  cajon: Joi.string().required(), 
});

app.post('/api/pagos', async (req, res) => {
  const { error } = pagoValidationSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { paymentMethodId, name, email, plates, model, plaza, cajon } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 3200 * 100, // Monto en centavos (ejemplo: $32.00 USD)
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
      receipt_email: email,
      metadata: { name, plates, model },
    });

    if (paymentIntent.status === 'succeeded') {
      const nuevoPago = new PagoInfo({
        nombre: name,
        correo: email,
        placas: plates,
        modelo: model,
        plaza,
        cajon,
        total: '$696.00'
      });
      await nuevoPago.save();
      res.status(200).json({ message: 'Pago realizado exitosamente' });
    } else {
      res.status(400).json({ message: 'Error en el pago: Estado del pago no es exitoso' });
    }
  } catch (error) {
    if (error.type === 'StripeCardError') {
      res.status(400).json({ message: 'Error con la tarjeta de crédito: ' + error.message });
    } else if (error.type === 'StripeInvalidRequestError') {
      res.status(400).json({ message: 'Error en la solicitud a Stripe: ' + error.message });
    } else if (error.type === 'StripeAPIError') {
      res.status(500).json({ message: 'Error del servidor de Stripe: ' + error.message });
    } else if (error.type === 'StripeConnectionError') {
      res.status(500).json({ message: 'Error de conexión con Stripe: ' + error.message });
    } else if (error.type === 'StripeAuthenticationError') {
      res.status(401).json({ message: 'Error de autenticación con Stripe: ' + error.message });
    } else {
      res.status(500).json({ message: 'Error desconocido al realizar el pago', error: error.message });
    }
  }
});

// =====================
// INICIAR SERVIDOR (SOLO UNA VEZ)
// =====================
const PORT = 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});
