//Creacion de controlador
const jobsCtrl = {};

//Importancion de modulos
const Jobs = require('../models/Jobs')
const Categorias = require('../models/Categorias');
const Users = require('../models/Users');
const Applications = require('../models/Applications');
const moment = require('moment')

//Vista Lista de trabajos por categoria
jobsCtrl.renderListaTrabajosCategorias = async (req, res) => {
    if (req.user) {
        const tipo_cuenta = req.user.tipo_cuenta;
        const xPage = 6;
        const page = req.params.page || 1;
        await Jobs
            .find({ cat_trabajo: req.params.id })
            .skip((xPage * page) - xPage)
            .limit(xPage)
            .exec((err, jobs) => {
                Jobs.count((err, count) => {
                    if (err) return next(err);
                    res.render('./jobs/lista-trabajos', {
                        tipo_cuenta,
                        jobs,
                        current: page,
                        pages: Math.ceil(count / xPage)
                    });
                });
            });
    }
    const xPage = 6;
    const page = req.params.page || 1;
    await Jobs
        .find({ cat_trabajo: req.params.id })
        .skip((xPage * page) - xPage)
        .limit(xPage)
        .exec((err, jobs) => {
            Jobs.count((err, count) => {
                if (err) return next(err);
                res.render('./jobs/lista-trabajos', {
                    jobs,
                    current: page,
                    pages: Math.ceil(count / xPage)
                });
            });
        });
}
//Vista de Visualizar detalles de trabajo
jobsCtrl.renderDetallesTrabajo = async (req, res) => {
    const xPage = 4
    const page = req.params.page || 1
    const user = req.user || null;
    const detailsJobs = await Jobs.findById(req.params.id);
    const userCreador = await Users.findById(detailsJobs.id_user);
    const applications = await Applications.find({ id_jobs: detailsJobs.id })
    const userLoginPostulado = []
    if (user) {
        const userLoginPostulado = await Applications.find({ $and: [{ id_jobs: detailsJobs.id }, { id_applicant: user.id }] })
        if (user.id === detailsJobs.id_user) {
            const applications = await Applications.find({ id_jobs: detailsJobs.id })
                .skip((xPage * page) - xPage).limit(xPage).exec((err, applications) => {
                    Applications.count({ id_jobs: detailsJobs._id }, (err, count) => {
                        if (err) {
 
                        } else {
                            res.render('./jobs/detalles-trabajo', {
                                jobsRelacionados, user, userLoginPostulado, detailsJobs, applications,
                                userCreador, current: page, pages: Math.ceil(count / xPage)
                            })
                        }
                    })
                })
            }
        if (userLoginPostulado.length > 0) {
  
            const jobsRelacionados = await Jobs.find({ $and: [{ cat_trabajo: detailsJobs.cat_trabajo }, { _id: { $not: { $eq: detailsJobs.id } } }] }).skip((xPage * page) - xPage).limit(xPage).exec((err, jobsRelacionados) => {
                Jobs.count({ cat_trabajo: detailsJobs.cat_trabajo }, (err, count) => {
                    if (err) {
              
                    } else {
                        res.render('./jobs/detalles-trabajo', { applications, user, detailsJobs, jobsRelacionados, userCreador, userLoginPostulado, current: page, pages: Math.ceil(count / xPage) })
                    }
                })
            })
        }
    }
    const jobsRelacionados = await Jobs.find({ $and: [{ cat_trabajo: detailsJobs.cat_trabajo }, { _id: { $not: { $eq: detailsJobs.id } } }] }).skip((xPage * page) - xPage).limit(xPage).exec((err, jobsRelacionados) => {
        Jobs.count({ cat_trabajo: detailsJobs.cat_trabajo }, (err, count) => {
            if (err) {
   
            } else {

                res.render('./jobs/detalles-trabajo', { applications, user, detailsJobs, jobsRelacionados, userLoginPostulado, userCreador, current: page, pages: Math.ceil(count / xPage) })
            }
        })
    })
}


//Vista de Visualizar formulario para anuncio de trabajo
jobsCtrl.renderAnunciarTrabajo = async (req, res) => {
    if (req.user) {
        if (req.user.tipo_cuenta === 'Empresa') {
            const empresa = req.user.tipo_cuenta;
            const usuario = req.user;
            const categorias = await Categorias.find();
            res.render('./jobs/anunciar-trabajo', { categorias, empresa, usuario })
        }
    } else {
        //req.flash('error_msg', 'No Autorizado');
        res.redirect('/')
    }
};

//Vista de Creacion de formulario de anuncio de trabajo
jobsCtrl.crearAnuncioTrabajo = async (req, res) => {
    const { titulo_trabajo, tipo_trabajo, ubicacion, salario, cat_trabajo, etiqueta, url, descripcion,resp_,resp_1,resp_2,resp_3 } = req.body;
    const { id, email, filename,skill_,skill_1,skill_2,skill_3 } = req.user;
    const newJobs = new Jobs({ id_user: id, titulo_trabajo, email, tipo_trabajo, ubicacion, salario, cat_trabajo, etiqueta, url, descripcion,
        perfil_img:filename,resp_,resp_1,resp_2,resp_3,skill_:skill_,skill_1:skill_1,skill_2:skill_2,skill_3:skill_3 });
    newJobs.id_user = req.user.id;
    await newJobs.save();
    req.flash('success_msg', 'Anuncio Publicado Correctamente')
    res.redirect('/')
};

//Vista de Visualizacion de formulario para Actualizar Anuncio de trabajo
jobsCtrl.renderEditarAnuncio = async (req, res) => {
    if (req.user) {
        const detailsJobs = await Jobs.findById(req.params.id);
        if (detailsJobs.id_user === req.user.id) {
            const empresa = req.user.tipo_cuenta;
            const id_usuario = detailsJobs.id_user;
            const img_profile = detailsJobs.profile_img
            const userCreador = await Users.findById(id_usuario);
            res.render('./jobs/detalles-trabajo', { detailsJobs, empresa, userCreador })
        }
        req.flash('error_msg', 'No Autorizado');
        res.render('index');
    }
    req.flash('error_msg', 'Debe Logearse Primero')
    res.render('index');
};

//Vista de Actualizacion de anuncio
jobsCtrl.actualizarAnuncio = async (req, res) => {
    const { titulo_trabajo, email, tipo_trabajo, ubicacion, salario, cat_trabajo, etiqueta, url, descripcion } = req.body;
    await Jobs.findByIdAndUpdate(req.params.id, { titulo_trabajo, email, tipo_trabajo, ubicacion, salario, cat_trabajo, etiqueta, url, descripcion })
    req.flash('success_msg', 'Anuncio Actualizado Correctamente');
    res.redirect('/lista-trabajos');
}

//Vista de Listado de Trabajos
jobsCtrl.renderListaTrabajos = async (req, res, next) => {
    if (req.query.buscar_jobs || req.query.buscar_ubi) {
        if (req.user) {
            const tipo_cuenta = req.user.tipo_cuenta
            const buscar_jobs = req.query.buscar_jobs
            const buscar_ubi = req.query.buscar_ubi
            const xPage = 6
            const page = req.params.page || 1
            const categorias = await Categorias.find();
            const categoriasN = await Categorias.find().sort({number: 1})

            var resultCat = []
            for (const item of categoriasN) {
                var userCategori = await Jobs.find({cat_trabajo: item.nombre})
                resultCat.push(userCategori)
              }
              console.log(resultCat)
      
            const jobs = await Jobs.find({ titulo_trabajo: { $regex: '.*' + buscar_jobs + '.*', $options: "i" }, ubicacion: { $regex: '.*' + buscar_ubi + '.*', $options: "i" } }, function (error, jobs) {
                if (error) {
      
                }
            })
                .sort({ _id: -1 }).skip((xPage * page) - xPage).limit(xPage).exec((err, jobs) => {
                    Jobs.count((err, count) => {
                        if (err) {
         
                        } else {
                            res.render('./jobs/lista-trabajos', { categorias, tipo_cuenta, jobs, current: page,resultCat, pages: Math.ceil(count / xPage) })
                        }
                    })
                })
        } else {

            const buscar_jobs = req.query.buscar_jobs;
            const buscar_ubi = req.query.buscar_ubi;
            const xPage = 6;
            const page = req.params.page || 1;
            const categorias = Categorias.find();
            const categoriasN = await Categorias.find().sort({number: 1})

            var resultCat = []
            for (const item of categoriasN) {
                var userCategori = await Jobs.find({cat_trabajo: item.nombre})
                resultCat.push(userCategori)
              }
              console.log(resultCat)
            const jobs = await Jobs
                .find({ titulo_trabajo: { $regex: '.*' + buscar_jobs + '.*', $options: "i" }, ubicacion: { $regex: '.*' + buscar_ubi + '.*', $options: "i" } }, function (error, jobs) {
                    if (error) {
        
                    }
                })
                .sort({ _id: -1 }).skip((xPage * page) - xPage).limit(xPage).exec((err, jobs) => {
                    Jobs.count((err, count) => {
                        if (err) {
                        } else {
                            res.render('./jobs/lista-trabajos', {
                                categorias,
                                jobs,
                                current: page,
                                resultCat,
                                pages: Math.ceil(count / xPage)
                            })
                        }
                    })
                })
        }
    }
    if (req.user) {
        const tipo_cuenta = req.user.tipo_cuenta;
        const xPage = 6;
        const page = req.params.page || 1;
        const categorias = await Categorias.find();

        const categoriasN = await Categorias.find().sort({number: 1})

        var resultCat = []
        for (const item of categoriasN) {
            var userCategori = await Jobs.find({cat_trabajo: item.nombre})
            resultCat.push(userCategori)
          }
          console.log(resultCat)
        const jobs = await Jobs.find().sort({ _id: -1 }).skip((xPage * page) - xPage).limit(xPage).exec((err, jobs) => {
            Jobs.count((err, count) => {
                if (err) {
 
                } else {
                    res.render('./jobs/lista-trabajos', {
                        categorias,
                        tipo_cuenta,
                        jobs,
                        current: page,
                        resultCat,
                        pages: Math.ceil(count / xPage)
                    })
                }
            })
        })
    } else {
        const xPage = 6;
        const page = req.params.page || 1;
        const categorias = await Categorias.find();
        const categoriasN = await Categorias.find().sort({number: 1})

        var resultCat = []
        for (const item of categoriasN) {
            var userCategori = await Jobs.find({cat_trabajo: item.nombre})
            resultCat.push(userCategori)
          }

        const jobs = await Jobs.find().sort({ _id: -1 }).skip((xPage * page) - xPage).limit(xPage).exec((err, jobs) => {
            Jobs.count((err, count) => {
                if (err) {
            
                } else {
         
                    res.render('./jobs/lista-trabajos', {
                        categorias,
                        jobs,
                        current: page,
                        pages: Math.ceil(count / xPage),
                        resultCat
                    })
                }
            })
        })
    }
}

jobsCtrl.filtrosTrabajos = async (req, res) => {
const filtro_vacante = req.body.tipo_vacante || [ 'Freelancer', 'Tiempo Completo', 'Medio Tiempo' ]
const filtro_cat = req.body.categoria || 
[
    'Diseño Gráfico',
    'Traducciones',
    'Edición de Imágenes',
    'Desarrollor web, móvil y software',
    'Soporte Administrativo',
    'Consultoría y Contabilidad',
    'Marketing Online',
    'Otros',
    'Cursos',
    'Ingenierias',
  ]
if (req.user) {
    const tipo_cuenta = req.user.tipo_cuenta;
    const xPage = 6;
    const page = req.params.page || 1;
    const categorias = await Categorias.find();
    const categoriasN = await Categorias.find().sort({number: 1})

    var resultCat = []
    for (const item of categoriasN) {
        var userCategori = await Jobs.find({cat_trabajo: item.nombre})
        resultCat.push(userCategori)
      }
      console.log(resultCat)
    const jobs = await Jobs.find({$and: [{cat_trabajo: {$in: filtro_cat}}, {tipo_trabajo: {$in: filtro_vacante}}]}).sort({ _id: -1 }).skip((xPage * page) - xPage).limit(xPage).exec((err, jobs) => {
        Jobs.count((err, count) => {
            if (err) {
    
            } else {
                res.render('./jobs/lista-trabajos', {
                    categorias,
                    tipo_cuenta,
                    jobs,
                    current: page,
                    pages: Math.ceil(count / xPage),
                    resultCat
                })
            }
        })
    })
} else {
    const xPage = 6;
    const page = req.params.page || 1;
    const categorias = await Categorias.find();
    const categoriasN = await Categorias.find().sort({number: 1})

    var resultCat = []
    for (const item of categoriasN) {
        var userCategori = await Jobs.find({cat_trabajo: item.nombre})
        resultCat.push(userCategori)
      }
      console.log(resultCat)
    const jobs = await Jobs.find({$and: [{cat_trabajo: {$in: filtro_cat}}, {tipo_trabajo: {$in: filtro_vacante}}]}).sort({ _id: -1 }).skip((xPage * page) - xPage).limit(xPage).exec((err, jobs) => {
        Jobs.count((err, count) => {
            if (err) {
                console.log('error')
            } else {
         
                res.render('./jobs/lista-trabajos', {
                    categorias,
                    jobs,
                    current: page,
                    pages: Math.ceil(count / xPage),
                    resultCat
                })
            }
        })
    })
}
}

//Exportando Modulo
module.exports = jobsCtrl;


