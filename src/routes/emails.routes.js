//Modulos requeridos
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer')
const User = require('../models/Users')

//Controlador de Email
const { enviarEmaildeContacto } = require('../controllers/emails.controller');

//Controlador de Contacto
const { crearMensajeDeContacto } = require('../controllers/index.controller')

//Ruta de creacion de aplicacion a anuncio
//router.post('/formulario-contacto', enviarEmaildeContacto, crearMensajeDeContacto)
router.post('/send-mail', async (req,res) => {
    const { name, email, phone, message } = req.body;

    contentHTML = `
        <h1>Información de formulario de contacto</h1>
        <ul>
            <li>Nombre de usuario: ${name}</li>
            <li>Correo electrónico: ${email}</li>
            <li>Número de contacto: ${phone}</li>
        </ul>
        <p>${message}</p>
    `;

    // Username
// test_web@studio73pty.com
// Password
// Use the email account's password.
// Incoming Server
// mail.studio73pty.com
// IMAP Port
// 993
// POP3 Port
// 995
// Outgoing Server
// mail.studio73pty.com
// SMTP Port
// 465

    const transporter = nodemailer.createTransport({
        host: 'mail.studio73pty.xyz',
        port: 465,
        // port: 587,
        secure: true,
        auth: {
            user: 'trabajaryaemailsender@studio73pty.xyz',
            pass: 'P@ssword!'
        },
        // tls:{
        //     rejectUnauthorized: false
        // }
    })

    try {
        const info = await transporter.sendMail({
            from: "'trabajarya' <trabajaryaemailsender@studio73pty.xyz>",
            to: "info@trabajarya.com",
            subject:'TrabajarYa Formulario de Contacto',
            //text:'hello world'
            html: contentHTML
        })
        
     
  
        res.render('contacto', {msg: 'Email enviado'})
    } catch (error) {
        console.log(error)
    }
    
    
})

router.post('/send-mail-user', async (req,res) => {
    

    const { username, email, message, email_user } = req.body;



    contentHTML = `
        <h1>Información de usuario</h1>
        <ul>
            <li>Nombre de usuario: ${username}</li>
        </ul>
        <p>${message}</p>
    `;


    const transporter = nodemailer.createTransport({
        // host: 'mail.fonsecatours.com',
        // port: 587,
        // secure: false,
        host: 'mail.studio73pty.xyz',
        port: 465,
        // port: 587,
        secure: true,
        auth: {
            user: 'trabajaryaemailsender@studio73pty.xyz',
            pass: 'P@ssword!'
        },
        // auth: {
        //     user: 'emails@fonsecatours.com',
        //     pass: '123456789'
        // },
        // tls:{
        //     rejectUnauthorized: false
        // }
    })
    try {
        const info = await transporter.sendMail({
            from: "'trabajarya' <trabajaryaemailsender@studio73pty.xyz>",
            to: `${email_user}`,
            
            subject:'Alguien quiere contactar contigo!',
            //text:'hello world'
            html: contentHTML
        })
        console.log(info)
        res.redirect('/')
        
    } catch (error) {
        console.log(error)
    }
    
    
    
})
router.post('/send/', async (req,res) => {
    


    contentHTML = `
        <p>hola</p>
    `;


    console.log('test')
    const transporter = nodemailer.createTransport({
        host: 'send.smtp.com',
        port: 2525,
        secure: false,
        auth: {
            user: 'no-reply@ewc-dev.com',
            pass: '88FwRx$xhv$xXr%Gp9'
        },
        tls:{
            rejectUnauthorized: false
        }
    })
    try {
        const info = await transporter.sendMail({
            from: "'hui' <no-reply@ewc-dev.com>",
            to: `erraco.wow@gmail.com`,
            
            subject:'Alguien quiere contactar contigo!',
            //text:'hello world'
            html: contentHTML
        })
        console.log(info)
        res.status(200).send('ok')
        
    } catch (error) {
        console.log(error)
    }
    
    
    
})

//Exportando modulo
module.exports = router;