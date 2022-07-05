//Creacion del controlador
const indexCtrl = {};

//Importando modelo de Usuarios
const User = require('../models/Users')
const Post = require("../models/PostBlog");

//Vista principal de la pagina
indexCtrl.renderIndex =  async (req, res) => {
    if (req.user){
        if (req.user.tipo_cuenta === 'Empresa'){
            const user = req.user;
            const applicant = await User.find({tipo_cuenta: "Freelancer"}).sort({_id: -1}).limit(3);
            res.render('index', {applicant, user});              
        }             
    };
    const applicant = await User.find({tipo_cuenta: "Freelancer"}).sort({_id: -1}).limit(3);
    const posts = await Post.find().sort({_id: -1}).limit(3);
    res.render('index', {applicant, posts:posts});
};

//Vista de la seccion de contacto
indexCtrl.renderContacto =  async (req, res) => {
    if (req.user){
        if (req.user.tipo_cuenta === 'Empresa'){
            const empresa = req.user.tipo_cuenta;
            res.render('contacto', {empresa});              
        }             
    }
    res.render('contacto');
};
/*
indexCtrl.crearMensajeDeContacto = async (req, res) => {
    const { titulo_trabajo, tipo_trabajo, ubicacion, salario, cat_trabajo, etiqueta, url, descripcion } = req.body;
    const {id, email} = req.user;
    const newJobs = new Jobs({id_user: id, titulo_trabajo, email, tipo_trabajo,ubicacion, salario, cat_trabajo,etiqueta, url,descripcion});
    newJobs.id_user = req.user.id;
    await newJobs.save();
    //req.flash('success_msg', 'Anuncio Publicado Correctamente') 
    res.redirect('/lista-trabajos')
*/
//Exportando modulo
module.exports = indexCtrl;