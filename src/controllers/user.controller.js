//Creacion del controlador
const userCtrl = {};
const {randomNumber} = require('../helpers/libs');

const path = require('path');
const request = require('request');

//Importando modelo de Usuarios
const User = require('../models/Users')
const Admin = require('../models/Admins')
const Jobs = require('../models/Jobs')
const Categorias = require('../models/Categorias')

//Importando modulo de autenticacon
const passport = require('passport');

const { application } = require('express');
const flash = require('connect-flash')
const multer = require('multer');
const  fs  = require('fs-extra');
const paypal = require('paypal-rest-sdk');
const Users = require('../models/Users');
const cloudinary = require('cloudinary')

//live
    const CLIENT = 'AfWRb0MCwvso9SNBs7wpHWeLllTnkZx7nfcEKM-H3tnBemfvGHW3MHx2x4rGMhHWmYyIROCh5AJSRgIi';

    const SECRET = 'EK1JvRf3Marhb8EoKzO1KBtwR28MW2wDeivn-oUbFdHWyqsSEsPnTZCfbooE58OkI_1KGK1K7HYwWFOz';

    const PAYPAL_API = 'https://api-m.paypal.com'; // Live https://api-m.paypal.com
    

//sandbox
// const CLIENT = 'AWZ8rEH_KwtPMqF94psimgpNBi03FPVvVQxIaTvjsp_9i2p7SiVfo6U_HdvPKuF4IsYf6CPCsY6Ik-8v';
// const SECRET = 'EOcXbGIOoaFg8RIswxGQigR03VRfafN7oIWKsbPjgNz-rrwVwlF3PyrqE180kuNQ17vaxc3llfBaqxtO';
// const PAYPAL_API = 'https://api-m.sandbox.paypal.com'; // Live https://api-m.paypal.com
const auth = { user: CLIENT, pass: SECRET }

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})


// const multerStorage = multer.memoryStorage();

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // cb(null, 'public/assets/images/users');
    // cb(null, path.join(__dirname,'../public/uploads/temp'));
    cb(null, path.join(__dirname,'../public/uploads'));
  },
  filename: (req, file, cb) => {
    //user-id-timestamp.extension
    const ext = file.mimetype.split('/')[1];
    cb(null, `user-${Date.now()}.${ext}`);
  },
});

const multerFilter = (req, file, cb) => {
    // console.log(file)
  if (file.mimetype.startsWith('image') || file.mimetype.startsWith('application')) {
    cb(null, true);
  } else {
    cb(
      new AppError('No es una imagen! Por favor solo suba imagenes', 400),
      false
    );
  }
};
const multerFilterPdf = (req, file, cb) => {
    console.log(file)
  if (file.mimetype.startsWith('application')) {
    cb(null, true);
  } else {
    cb(
      new AppError('No es una imagen! Por favor solo suba pdf', 400),
      false
    );
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});
const uploadFile = multer({
  storage: multerStorage,
  fileFilter: multerFilterPdf,
});


// userCtrl.uploadUserPhoto = upload.single('photo');
userCtrl.uploadUserPhoto = upload.fields([
    {name: 'photo', maxCount:1},
    {name: 'cv', maxCount:1}
]);
userCtrl.uploadUserPic = upload.single('userpic');
userCtrl.uploadUserPDF = uploadFile.single('userpdf');
//Vista de sección de elección
userCtrl.renderChooseSignupOption = (req, res) => {
    res.render('users/choose-signup-option')
}
userCtrl.renderAccesoCandidatos = (req, res) => {  
    res.render('users/acceso-candidatos')
}
userCtrl.renderAccesoEmpresas = (req, res) => {
    res.render('users/acceso-empresas')
}



//Vista de formulario de Signup 
userCtrl.renderSignupForm = (req, res) => {
    res.render('users/signup')
}
userCtrl.renderSignupFormE = (req, res) => {
    res.render('users/signup-enterprise')
}
userCtrl.renderMembership = (req, res) => {
    res.render('users/membresia')
}
userCtrl.renderPaymentSucess = async (req, res) => {

    const user = await User.findById(req.user.id)
 
    const datos = req.query;
    const status = 'plus'
    const status_basic = 'basico'
    const plusExp = new Date()
    const status_user = await User.findByIdAndUpdate(req.user.id,{$set:{isNewUser:status,plusExpires:plusExp}})

    res.render('users/sucess', {status_user,datos})
}
userCtrl.renderMembershipSucess = async (req, res) => {

    const user = await User.findById(req.user.id)

    const datos = req.query;
    const status = 'plus'
    const status_basic = 'basico'
    const plusExp = new Date()
    const status_user = await User.findByIdAndUpdate(req.user.id,{$set:{isNewUser:status,plusExpires:plusExp}})

    res.render('users/sucess-membresia', {status_user,datos})
}
userCtrl.renderSignupFormAdmin = (req, res) => {
    res.render('signup-admin')
}



//Creacion de Usuarios
userCtrl.signup = async (req, res) => {
    let errors = [];
    // console.log(req.files.photo)
    // console.log(req.files.cv)
    // console.log(req.body)
    failureFlash: true;
    const { username, email, password, password_confirm, tipo_cuenta,ciudad,pais, categoria,acerca } = req.body;
    const expe_traba = {periodo: req.body.periodo_laboral, 
        titulo_trabajo: req.body.titulo_trabajo,
        nom_empresa: req.body.nom_empresa,
        desc_trabajo: req.body.descripcion_trabajo,
        deta_trabajo: req.body.detalles_trabajo }
    const expe_estu = {periodo: req.body.periodo_estudio,
        nom_academia: req.body.nom_estudio,
        deta_estudio: req.body.detalles_estudio}
        
    if (password != password_confirm) {
       // req.flash('message','las contrasenas no coinciden');
       // res.redirect('/user/signup');

        errors.push({ text: "Las Contraseñas no coinciden." });
    }
    if (password.length < 4) {
        errors.push({ text: "La Contraseña debe tener al menos 4 digitos." });
    }
    if (errors.length > 0) {

         res.render('users/signup', {
           errors
        });
    }

    else {
        // Si el correo ya existe
        const emailUser = await User.findOne({ email: email });
        if (emailUser || errors.length>0) {
            //req.flash("error_msg", "El Email se encuentra en uso.");
            //res.redirect('/');
            errors.push({ text: "El email ya se encuentra en uso." });
            await fs.unlink(req.files.photo[0].path)
            await fs.unlink(req.files.cv[0].path)
            res.status(400).send('El email se encuentra en uso')
            // .render('users/signup', {
                //     errors
                //  });
            } else {
            console.log(req.files.photo)
            console.log(req.files.cv)
            // Guardo el usuario
            const imgUrl = randomNumber();
            const cvUrl = randomNumber();
            const imageTempPath = req.files.photo[0].path;
            const ext = path.extname(req.files.photo[0].originalname).toLowerCase();
            const targetPath = path.resolve(`src/public/uploads/${imgUrl}${ext}`)
        
            console.log(targetPath)
            console.log(imageTempPath)
            console.log(ext)

            const cvTempPath = req.files.cv[0].path;
            const extt = path.extname(req.files.cv[0].originalname).toLowerCase();
            const cvTargetPath = path.resolve(`src/public/uploads/${cvUrl}${extt}`)

            
            if (ext === '.png' || ext === '.jpeg' ||ext === '.jpg' || extt === '.pdf' ){
                await fs.rename(imageTempPath, targetPath);

                await fs.rename(cvTempPath, cvTargetPath);
        
                const newImg = imgUrl+ext
                const newCv = cvUrl+extt
       
              try {
                  const resultCloud = await cloudinary.v2.uploader.upload(`src/public/uploads/${newImg}`);
                  const resultCloudCv = await cloudinary.v2.uploader.upload(`src/public/uploads/${newCv}`);
                  
                    console.log(resultCloud)
                    console.log(resultCloudCv)
                // const imageSaved = await User.findByIdAndUpdate(req.user.id,{$set:{filename:result.url}})

                const newUser = new User({ username, email, password, tipo_cuenta,ciudad,pais,categoria,acerca, filename:resultCloud.url,cvfilename:resultCloudCv.url });
                console.log(newUser)
                const userId  = newUser._id
                newUser.password = await newUser.encryptPassword(password);
                // console.log(userId);
                const result = await newUser.save();
                console.log(result)
              const tra =  await User.findByIdAndUpdate(userId, {$addToSet: {trabajos: expe_traba}})
                const stui = await User.findByIdAndUpdate(userId, {$addToSet: {estudios: expe_estu}})
                // console.log(tra);
                // const cvSaved = await User.findByIdAndUpdate(userId,{$set:{cvfilename:`/uploads/${req.files.cv[0].filename}`}})
                // console.log(stui);
                await fs.unlink(targetPath)
                // await fs.unlink(cvTempPath);
                // await fs.unlink(req.file.path)
                req.flash('success_msg', 'Usuario registrado exitosamente.')
                // res.redirect('/user/login');
                res.status(200).send('Registro exitoso, por favor inicia sesión')
                
        
              
        
              } catch (error) {
                  console.log(error)
              } 
              
               // const imageSaved = await User.findByIdAndUpdate(req.user.id,{$set:{filename:newImg}})
        
            }


  
        }
    }


};
// userCtrl.signup = async (req, res) => {
//     let errors = [];
//     // console.log(req.files.photo)
//     // console.log(req.files.cv)
//     // console.log(req.body)
//     failureFlash: true;
//     const { username, email, password, password_confirm, tipo_cuenta,ciudad,pais, categoria,acerca } = req.body;
//     const expe_traba = {periodo: req.body.periodo_laboral, 
//         titulo_trabajo: req.body.titulo_trabajo,
//         nom_empresa: req.body.nom_empresa,
//         desc_trabajo: req.body.descripcion_trabajo,
//         deta_trabajo: req.body.detalles_trabajo }
//     const expe_estu = {periodo: req.body.periodo_estudio,
//         nom_academia: req.body.nom_estudio,
//         deta_estudio: req.body.detalles_estudio}
        
//     if (password != password_confirm) {
//        // req.flash('message','las contrasenas no coinciden');
//        // res.redirect('/user/signup');

//         errors.push({ text: "Las Contraseñas no coinciden." });
//     }
//     if (password.length < 4) {
//         errors.push({ text: "La Contraseña debe tener al menos 4 digitos." });
//     }
//     if (errors.length > 0) {

//          res.render('users/signup', {
//            errors
//         });
//     }

//     else {
//         // Si el correo ya existe
//         const emailUser = await User.findOne({ email: email });
//         if (emailUser || errors.length>0) {
//             //req.flash("error_msg", "El Email se encuentra en uso.");
//             //res.redirect('/');
//             errors.push({ text: "El email ya se encuentra en uso." });
//             await fs.unlink(req.files.photo[0].path)
//             await fs.unlink(req.files.cv[0].path)
//             res.status(400).send('El email se encuentra en uso')
//             // .render('users/signup', {
//                 //     errors
//                 //  });
//             } else {
//             console.log(req.files.photo)
//             console.log(req.files.cv)
//             // Guardo el usuario
//             const imgUrl = randomNumber();
//             const imageTempPath = req.files.photo[0].path;
//             const ext = path.extname(req.files.photo[0].originalname).toLowerCase();
//             const targetPath = path.resolve(`src/public/uploads/${imgUrl}${ext}`)
        
//             console.log(targetPath)
//             console.log(imageTempPath)
//             console.log(ext)

//             const cvTempPath = req.files.cv[0].path;
//             const extt = path.extname(req.files.cv[0].originalname).toLowerCase();
        

            
//             if (ext === '.png' || ext === '.jpeg' ||ext === '.jpg' || extt === '.pdf' ){
//                 await fs.rename(imageTempPath, targetPath);
        
//                 const newImg = imgUrl+ext
       
//               try {
//                   const resultCloud = await cloudinary.v2.uploader.upload(`src/public/uploads/${newImg}`);
                  
//                     console.log(resultCloud)
//                 // const imageSaved = await User.findByIdAndUpdate(req.user.id,{$set:{filename:result.url}})

//                 const newUser = new User({ username, email, password, tipo_cuenta,ciudad,pais,categoria,acerca, filename:resultCloud.url });
//                 const userId  = newUser._id
//                 newUser.password = await newUser.encryptPassword(password);
//                 // console.log(userId);
//                 const result = await newUser.save();
//                 console.log(result)
//               const tra =  await User.findByIdAndUpdate(userId, {$addToSet: {trabajos: expe_traba}})
//                 const stui = await User.findByIdAndUpdate(userId, {$addToSet: {estudios: expe_estu}})
//                 // console.log(tra);
//                 const cvSaved = await User.findByIdAndUpdate(userId,{$set:{cvfilename:`/uploads/${req.files.cv[0].filename}`}})
//                 // console.log(stui);
//                 await fs.unlink(targetPath)
//                 // await fs.unlink(cvTempPath);
//                 // await fs.unlink(req.file.path)
//                 req.flash('success_msg', 'Usuario registrado exitosamente.')
//                 // res.redirect('/user/login');
//                 res.status(200).send('Registro exitoso, por favor inicia sesión')
                
        
              
        
//               } catch (error) {
//                   console.log(error)
//               } 
              
//                // const imageSaved = await User.findByIdAndUpdate(req.user.id,{$set:{filename:newImg}})
        
//             }


  
//         }
//     }


// };
//update data

userCtrl.signupEmpresa = async (req, res) => {
    let errors = [];
    
    failureFlash: true;
    const { username, email, password, password_confirm,pais,ciudad } = req.body;
    //tipo_cuenta='Empresa';
    const tipo_cuenta='Empresa';

    //console.log(tipo_cuenta)
    if (password != password_confirm) {
       // req.flash('message','las contrasenas no coinciden');

        errors.push({ text: "Las Contraseñas no coinciden!!!." });
    }
    if (password.length < 4) {
        errors.push({ text: "La Contraseña debe tener al menos 4 digitos !!!!!!!!." });
    }
    if (errors.length > 0) {
        //  res.redirect('/user/signup');
        //const alert = errors.array()

         ///console.log(alert)

        //  res.render('/user/signup/signup-enterprise', {
         res.render('users/signup-enterprise', {
           errors
        });
    }

    else {
        // Si el correo ya existe
        const emailAdmin = await Users.findOne({ email: email });
        if (emailAdmin || errors.length>0) {
            //req.flash("error_msg", "El Email se encuentra en uso.");
            //res.redirect('/');
            errors.push({ text: "El email ya se encuentra en uso." });

            res.render('users/signup-enterprise', {
            // res.render('signup-admin', {
                errors
             });
        } else {
            // Guardo el usuario
            const newAdmin = new Users({ username, email, password, tipo_cuenta,pais, ciudad});
            
            newAdmin.password = await newAdmin.encryptPassword(password);
            await newAdmin.save();
            
            req.flash('success_msg', 'Usuario registrado exitosamente.')
            res.redirect('/user/acceso-empresas');
            

        }
    }

 
};



userCtrl.signupAdmin = async (req, res) => {
    let errors = [];
    
    failureFlash: true;
    const { username, email, password, password_confirm } = req.body;
    //tipo_cuenta='Empresa';
    const tipo_cuenta='Admin';
    const pais='Admin'
    const ciudad='Admin'


    //console.log(tipo_cuenta)
    if (password != password_confirm) {
       // req.flash('message','las contrasenas no coinciden');

        errors.push({ text: "Las Contraseñas no coinciden!!!." });
    }
    if (password.length < 4) {
        errors.push({ text: "La Contraseña debe tener al menos 4 digitos !!!!!!!!." });
    }
    if (errors.length > 0) {
        //  res.redirect('/user/signup');
        //const alert = errors.array()

         ///console.log(alert)

         res.render('/administracion/signup_', {
           errors
        });
    }

    else {
        // Si el correo ya existe
        const emailAdmin = await Users.findOne({ email: email });
        if (emailAdmin || errors.length>0) {
            //req.flash("error_msg", "El Email se encuentra en uso.");
            //res.redirect('/');
            errors.push({ text: "El email ya se encuentra en uso." });

            res.render('signup-admin', {
                errors
             });
        } else {
            // Guardo el usuario
            const newAdmin = new Users({ username, email, password, tipo_cuenta,pais, ciudad});
            
            newAdmin.password = await newAdmin.encryptPassword(password);
            await newAdmin.save();
            
            req.flash('success_msg', 'Usuario registrado exitosamente.')
            res.redirect('/administracion/login');
            

        }
    }

 
};

//Vista de formulario de Login
userCtrl.renderLoginForm =  (req, res) => {

    res.render('users/signin')
}
userCtrl.renderChat = (req, res) => {
    res.render('users/privatechat')
}
userCtrl.renderLoginFormAdmin =  (req, res) => {
    res.render('signin-admin')
}

//Inicio de Sesion 

//    userCtrl.login = passport.authenticate('local', {
   
//     failureRedirect: '/user/login',
//      successRedirect: '/user/edit-perfil',
//       failureFlash: true
//    }
//  );
userCtrl.login =  (req,res,next) => {
    passport.authenticate("local",(err,user,info)=>{
        if (err) throw err;
        if (!user) {
            req.flash('success_msg', 'Estas credenciales no coinciden.')
            res.redirect('/user/acceso-candidatos')
        }
        else {
            req.logIn(user, (err) => {
                
                if (err) throw err;
                
                User.findOne({'email': user.email},(err,user)=>{
       
                    var dateMem = user.plusExpires
                    var date1 = new Date();
           
                    
                        if (user.isNewUser == "basico" ){
                        

                            if ( user.tipo_cuenta == 'Freelancer' ){
                                
                                res.redirect('/user/edit-perfil')
                                // res.redirect('/user/membresia')
                                
                            } else if (user.tipo_cuenta == 'Empresa') {
                               
                                res.redirect('/user/edit-perfil')
                                    
                            } else {
                                
                                res.redirect('/user/edit-perfil')
                       
    
                            }
                    }else {
                        if( user.isNewUser === "plus" ){
                            let diff = date1.getTime() - dateMem.getTime()
                            
                            
                            let msInDay = 1000 * 3600 * 24;
                            
                            
                            result = diff/msInDay
                            
                            
                            if( result <= 365){
                                
                                
                                
                                res.redirect('/user/edit-perfil')
                            }
                            if(result >= 30) {
                                const status_basic = 'basico'
                                const plusExp = null
                              
                                async function setToBasic() {
                                    const status_user = await User.findByIdAndUpdate(req.user.id,{$set:{isNewUser:status_basic,plusExpires:plusExp}})
                                    
                                  }
                                  setToBasic();
                            
                                
                                res.redirect('/user/membresia')
                            }
                            
                        }
                    }              

                    
                    

                })

            })
        }
    })(req,res,next)
}
userCtrl.loginAdmin = (req,res,next) => {
    passport.authenticate("local",(err,user,info)=>{
        if (err) throw err;
        if (!user) res.send("No existe usuario")
        else {
            req.logIn(user, (err) => {
                
                if (err) throw err;
                
                Admin.findOne({'email': user.email},async(err,user)=>{
                    const users = await User.findById(req.params.id)
                 
                    
                    res.redirect('administracion/panel' ,{ users })
                    

                })

            })
        }
    })(req,res,next)
}

userCtrl.isPlus = (req,res) => {
    console.log(req.user)
}


// userCtrl.login = passport.authenticate('local', {
//     if()
// })

// userCtrl.login = passport.authenticate('local', {
        
//          failureRedirect: '/user/login'
//         // successRedirect: '/',
//         // successRedirect: '/user/edit-perfil',
//         // failureFlash: true
//           }),(req,res) => {
//               if (req.User.email === true) {
//                   res.redirect('/')
//               }
//           };


// userCtrl.login= passport.authenticate('local',{
//     failureRedirect:'/',
    
// }),(req,res)=>{
//     //const cargoUser = await User.findOne(cargo = ''));
//     if (req.User.tipo_cuenta === 'Empresa') {
//         console.log("Redirect")
//         res.redirect('/');
//     }
//     if (req.User.tipo_cuenta === 'Freelancer') {
//         console.log("Redirect2")
//         res.redirect('user/edit-perfil');
//     }
// }


// userCtrl.get('/', function(req, res, next){
//     passport.authenticate('local',function(err,user,info){
//         if(err) {return next(err);}

//         if(!user) {return res.redirect('user/login');}
//         req.logIn(user, function(err){
//             if(err){ return next(err);}
//             return res.redirect('/')
//         })
//     }) (req,res,next);
// })

//Vista de Cerrar sesion
userCtrl.logout = (req, res) => {
    req.logout();
    req.flash('success_msg', 'Tu sesion ha sido cerrada'); 
    res.redirect('/')
};

//Vista de lista de freelancer
userCtrl.renderListaCandidatos = async (req, res) => {
    if (req.query.buscar_free) {
        if (req.user) {
            const userlog = req.user;
            const amount = await User.find({ approved: true})
            const categoriasN = await Categorias.find()
            var resultCat = []
    
            // await Promise.all(
                categoriasN.map( async(value,index) => {
                    var userCategori = await User.find({categoria: item.nombre, approved: true, tipo_cuenta: 'Freelancer'})
              
                    resultCat.push(userCategori)
                })
                // console.log(resulCat)
            //   );
            //   console.log(resultCat)
            
            var totalusers = amount.length
            const tipo_cuenta = req.user.tipo_cuenta;
            const buscar_free = req.query.buscar_free;
            const xPage = 10;
            const page = req.params.page || 1;
            const applicant = await User.find({ username: { $regex: '.*' + buscar_free + '.*', $options: 'i' }, tipo_cuenta: 'Freelancer', approved: true }, function (error, applicant) {
                if (error) {
             
                }
            })
                .skip((xPage * page) - xPage).limit(xPage).exec((err, applicant) => {
                    User.count({tipo_cuenta: 'Freelancer'}, (err, count) => {
                        if (err) {
                            console.log('error en el conteo')
                        } else {
                            // res.render('./users/candidatos', { userlog,tipo_cuenta, applicant, current: page, pages: Math.ceil(count / xPage), amount: totalusers, categorias:categoriasN,resultCat })
                            res.render('./users/candidatos', { userlog,tipo_cuenta, applicant, current: page, pages: Math.ceil(totalusers / xPage), amount: totalusers, categorias:categoriasN,resultCat })
                        }
                    })
                })
        } else {
            const userlog = req.user;
              
        const amount = await User.find({ approved: true})
        const categoriasN = await Categorias.find().sort({number: 1})
        var resultCat = []
        for (const item of categoriasN) {
            var userCategori = await User.find({categoria: item.nombre, approved: true, tipo_cuenta: 'Freelancer'})
            resultCat.push(userCategori)
          }
      

        // await Promise.all(
            // categoriasN.map( async(value,index) => {
            //     var userCategori = await User.find({categoria: value.nombre})
            //     // console.log(value)
            //     resultCat.push(userCategori)
            // })
        //   );
        //   console.log(resultCat)
        var totalusers = amount.length
            const buscar_free = req.query.buscar_free;
            const xPage = 6;
            const page = req.params.page || 1;
            const applicant = await User.find({ username: { $regex: '.*' + buscar_free + '.*', $options: 'i' }, tipo_cuenta: 'Freelancer' , approved: true}, function (error, applicant) {
                if (error) {
                    console.log('error en el find')
                }
            })
                .skip((xPage * page) - xPage).limit(xPage).exec((err, applicant) => {
                    User.count({tipo_cuenta: 'Freelancer'}, (err, count) => {
                        if (err) {
                            console.log('error en el conteo')
                        } else {
                            // res.render('./users/candidatos', { applicant,userlog, current: page, pages: Math.ceil(count / xPage), amount: totalusers, categorias:categoriasN,resultCat })
                            res.render('./users/candidatos', { applicant,userlog, current: page, pages: Math.ceil(totalusers / xPage), amount: totalusers, categorias:categoriasN,resultCat })
                        }
                    })
                })
        }
    }
    if (req.user) {
        const userlog = req.user;
  
        const amount = await User.find({ approved: true})
        const categoriasN = await Categorias.find().sort({number: 1})
        var resultCat = []
        for (const item of categoriasN) {
            var userCategori = await User.find({categoria: item.nombre, approved: true, tipo_cuenta: 'Freelancer'})
            resultCat.push(userCategori)
            // console.log('eee')
          }
        

        // await Promise.all(
            // categoriasN.map( async(value,index) => {
            //     var userCategori = await User.find({categoria: value.nombre})
            //     // console.log(value)
            //     resultCat.push(userCategori)
            // })
        //   );
        //   console.log(resultCat)
          var totalusers = amount.length
        const tipo_cuenta = req.user.tipo_cuenta;
        const xPage = 6;
        const page = req.params.page || 1;
        const applicant = await User.find({ tipo_cuenta: 'Freelancer', approved: true }).skip((xPage * page) - xPage).limit(xPage).exec((error, applicant) => {
            User.count({tipo_cuenta: 'Freelancer'}, (error, count) => {
                if (error) {
                    console.log('error1')
                } else {
                    console.log('a')
                    res.render('./users/candidatos', {
                        // tipo_cuenta,userlog, applicant, current: page, pages: Math.ceil(count / xPage), amount: totalusers, categorias:categoriasN,resultCat
                        tipo_cuenta,userlog, applicant, current: page, pages: Math.ceil(totalusers / xPage), amount: totalusers, categorias:categoriasN,resultCat
                    })
                }
            })
        })
    } else {
        const userlog = req.user;

        const xPage = 10;
        const page = req.params.page || 1;
        const amount = await User.find({ approved: true})
        const categoriasN = await Categorias.find().sort({number: 1})
        console.log(categoriasN)
        var resultCat = []
        for (const item of categoriasN) {
            var userCategori = await User.find({categoria: item.nombre, approved: true, tipo_cuenta: 'Freelancer'})
            // console.log(userCategori)
            resultCat.push(userCategori)
        }
        // console.log(resultCat)
        
        // console.log('aaaaasdasdasdaa')
        // await Promise.all(
        //     categoriasN.map( async(value,index) => {
        //         var userCategori = await User.find({categoria: value.nombre})
        //         // console.log(value)
        //         console.log(userCategori)
        //         resultCat.push(userCategori)
        //     })
        //   );
        // console.log(resultCat)

        var totalusers = amount.length
        const applicant = await User.find({ tipo_cuenta: 'Freelancer', approved: true }).skip((xPage * page) - xPage).limit(xPage).exec((error, applicant) => {
            // console.log(applicant)
            User.count({tipo_cuenta: 'Freelancer'}, (error, count) => {
                if (error) {
                    console.log('error1')
                } else {
                    // console.log( applicant.length)
                    res.render('./users/candidatos', {
                        userlog,applicant, current: page, pages: Math.ceil(totalusers / xPage), amount: totalusers, categorias:categoriasN,resultCat
                        // userlog,applicant, current: page, pages: Math.ceil(count / xPage), amount: totalusers, categorias:categoriasN,resultCat
                    })
                }
            })
        })
    }
}

userCtrl.renderListaCandidatosFiltro = async (req, res) => {
    const filtro_cat = req.body.categoria || 
    [
        'Diseño Gráfico',
        'Traducciones',
        'Edición de Imágenes',
        'Desarrollador web, móvil y software',
        'Soporte Administrativo',
        'Consultoría y Contabilidad',
        'Marketing Online',
        'Otros',
        'Cursos',
        'Ingenierias',
      ]
    if (req.user) {
        const userlog = req.user;
        const tipo_cuenta = req.user.tipo_cuenta;
        const xPage = 100;
        const page = req.params.page || 1;
        const categorias = await Categorias.find().sort({number: 1})
        var resultCat = []
        for (const item of categorias) {
            var userCategori = await User.find({categoria: item.nombre, approved: true, tipo_cuenta: 'Freelancer'})
            resultCat.push(userCategori)
          }

        // await Promise.all(
            // categorias.map( async(value,index) => {
            //     var userCategori = await User.find({categoria: value.nombre})
            //     console.log(value)
            //     resultCat.push(userCategori)
            // })
        //   );
        // console.log(resultCat)
        console.log('a')
        const amount = await User.find()
        const jobs = await Users.find({$and: [{categoria: {$in: filtro_cat}, approved: true, tipo_cuenta: 'Freelancer'}]}).sort({ _id: -1 }).skip((xPage * page) - xPage).limit(xPage).exec((err, applicant) => {
            Users.count((err, count) => {
                if (err) {
        
                } else {
                    res.render('./users/candidatos-filtrados', {
                        userlog,
                        categorias,
                        tipo_cuenta,
                        applicant,
                        current: page,
                        amount:amount.length,
                        pages: Math.ceil(amount.length / xPage),
                        resultCat
                    })
                }
            })
        })
    } else {


        const userlog = req.user;
        console.log('b')
        const xPage = 100;
        const page = req.params.page || 1;
        const categorias = await Categorias.find().sort({number: 1})
        var resultCat = []
        for (const item of categorias) {
            var userCategori = await User.find({categoria: item.nombre, approved: true, tipo_cuenta: 'Freelancer'})
            resultCat.push(userCategori)
          }

        // await Promise.all(
            // categorias.map( async(value,index) => {
            //     var userCategori = await User.find({categoria: value.nombre})
            //     // console.log(userCategori)
            //     resultCat.push(userCategori)
            // })
        //   );
        console.log(resultCat)
        // console.log('result')
        const amount = await User.find()
        const jobs = await Users.find({$and: [{categoria: {$in: filtro_cat},approved: true, tipo_cuenta: 'Freelancer'}]}).sort({ _id: -1 }).skip((xPage * page) - xPage).limit(xPage).exec((err, applicant) => {
            // console.log(applicant)
            Users.count((err, count) => {
                if (err) {
                    console.log('error')
                } else {
             
                    res.render('./users/candidatos-filtrados', {
                        userlog,
                        categorias,
                        applicant,
                        current: page,
                        pages: Math.ceil(amount.length / xPage),
                        amount:amount.length,
                        resultCat
                    })
                }
            })
        })
    }
}

//Vista de perfil de freelancer
userCtrl.renderPerfilUser = async (req, res) => {
    if (req.user) {
        if (req.user.tipo_cuenta === 'Empresa') {
            const empresa = req.user.tipo_cuenta;
            const username = req.user.username;
            const idempresa = req.user.id;
            const user = await User.findById(req.params.id)
       
            res.render('./users/perfil-user', { empresa, user,idempresa,username })
        }
        if (req.user.tipo_cuenta === 'Admin') {
            const admin = req.user.tipo_cuenta;
            const username = req.user.username;
            const idadmin = req.user.id;
            const user = await User.findById(req.params.id)
      
            res.render('./users/perfil-user-admin', { admin, user,idadmin })
        }
    }
  
    const user = await User.findById(req.params.id)
 
    res.render('./users/perfil-user-public', { user })
};

//Vista de Formulario de editar perfil
userCtrl.renderEditPerfil = async (req, res) => {
    const user = req.user;


    
    res.render('./users/perfil-user-edit', {user})
}
userCtrl.updateAllUsers = async (req, res) => {
    var users = await User.find()
    const update = { approved: false };
    await Promise.all(
        users.map( async(value,index) => {
            var updatedUser = await User.findByIdAndUpdate({_id: value._id}, update)
            console.log(updatedUser)
            // resultCat.push(userCategori)
        })
      ).then((result) => {
        console.log('done')
        res.status(200)
      })

}
userCtrl.actualizarCategoria = async (req, res) => {
    console.log(req.params.id)
    console.log(req.body)
    const update = { categoria: req.body.categoria };
    try {
        var updatedUser = await User.findByIdAndUpdate({_id: req.params.id}, update)
        console.log(updatedUser)
        res.redirect(`/perfil-user/${req.params.id}`)
    } catch (error) {
        res.status(400).send('error')
        const user = await User.findById(req.user.id)
        res.redirect(`/perfil-user/${req.params.id}`)
    }



}

//Actualizar Perfil de Usuario
userCtrl.editPerfil = async (req, res) => {
 
    const  {cargo,direccion,salario,acerca,pais,tipoempresa,userfacebook,usertwitter,usergoogle,userlinkedin,skill_,skill_1,skill_2,skill_3,phone,categoria} = req.body

    await User.findByIdAndUpdate(req.user.id,{$set:{cargo:cargo,direccion:direccion,salario:salario,acerca:acerca,pais:pais,phone:phone
        ,tipoempresa:tipoempresa,userfacebook:userfacebook,usertwitter:usertwitter,usergoogle:usergoogle,userlinkedin:userlinkedin,categoria:categoria,
        skill_:skill_,skill_1:skill_1,skill_2:skill_2,skill_3:skill_3}})
    const user = await User.findById(req.user.id)
    res.render('./users/perfil-user-edit', {user})
     
    
}
userCtrl.updateDatos = async (req, res) => {
    let errors = [];
    

    const  {password, password_confirm} = req.body
    if (password != password_confirm) {
        // req.flash('message','las contrasenas no coinciden');
        // res.redirect('/user/signup');

         errors.push({ text: "Las Contraseñas no coinciden!!!." });
     }
     if (password.length < 4) {
         errors.push({ text: "La Contraseña debe tener al menos 4 digitos !!!!!!!!." });
     }
     if (errors.length > 0) {
         //  res.redirect('/user/signup');
         //const alert = errors.array()
          console.log(errors);
          ///console.log(alert)
          console.log('errores')
          res.render('./users/cambio-pass', {
            errors
         });
     }
     else {
         // Si el correo ya existe
         await User.findByIdAndUpdate(req.user.id,{$set:{password:password}})
         
            const user = await User.findById(req.user.id)
            user.password = await user.encryptPassword(password)
            await user.save()
            res.render('./users/perfil-user-edit', {user})
         }
}

userCtrl.updateDatosUser = async (req, res) => {
    let errors = [];
 
    
    console.log(req.body)
    const  {password, password_confirm,userid,test,username } = req.body
    console.log(userid)
    console.log(username)
    
    if (password != password_confirm) {
        // req.flash('message','las contrasenas no coinciden');
        // res.redirect('/user/signup');
     
         errors.push({ text: "Las Contraseñas no coinciden!!!." });
     }
     if (password.length < 4) {
         errors.push({ text: "La Contraseña debe tener al menos 4 digitos !!!!!!!!." });
     }
     if (errors.length > 0) {
         //  res.redirect('/user/signup');
         //const alert = errors.array()
          console.log(errors);
          ///console.log(alert)
 
          
          res.render('./users/sucess-password', {
            errors
         });
     }
     else {
         // Si el correo ya existe
        try {
            await User.findByIdAndUpdate(userid,{$set:{password:password}})

               const user = await User.findById(userid)
               user.password = await user.encryptPassword(password)
               await user.save()
               res.render('./users/sucess-password', {user})
        } catch (error) {
            console.log(error)
        }
         }

    

}


userCtrl.renderEditJob = async (req, res) => {
    const user = req.user;
    const jobs = await Jobs.find({id_user: user._id});
    //const userCreador = await Users.findById(detailsJobs.id_user);



    res.render('./users/edit-jobs', {user,jobs})
}
userCtrl.renderEditJobs = async (req, res) => {
//     const user = req.user;
//     const jobs = await Jobs.find({tipo_cuenta: "Empresa"}).sort({_id: -1}).limit(3);
    
   
//  console.log('trabajos')
//     console.log(user._id)
//     console.log(jobs)
   

//     res.render('./users/edit-jobs', {user,jobs})
 if (req.query.buscar_jobs || req.query.buscar_ubi) {
        if (req.user) {
            const tipo_cuenta = req.user.tipo_cuenta
            const buscar_jobs = req.query.buscar_jobs
            const buscar_ubi = req.query.buscar_ubi
            const xPage = 6
            const page = req.params.page || 1
            const categorias = await Categorias.find();
            const jobs = await Jobs.find({ titulo_trabajo: { $regex: '.*' + buscar_jobs + '.*', $options: "i" }, ubicacion: { $regex: '.*' + buscar_ubi + '.*', $options: "i" } }, function (error, jobs) {
                if (error) {
                    console.log('error en el find')
                }
            })
                .sort({ _id: -1 }).skip((xPage * page) - xPage).limit(xPage).exec((err, jobs) => {
                    Jobs.count((err, count) => {
                        if (err) {
                            console.log('error en el count')
                        } else {
                            res.render('./jobs/lista-trabajos-admin', { categorias, tipo_cuenta, jobs, current: page, pages: Math.ceil(count / xPage) })
                        }
                    })
                })
        } else {
            const buscar_jobs = req.query.buscar_jobs;
            const buscar_ubi = req.query.buscar_ubi;
            const xPage = 6;
            const page = req.params.page || 1;
            const categorias = Categorias.find();
            const jobs = await Jobs
                .find({ titulo_trabajo: { $regex: '.*' + buscar_jobs + '.*', $options: "i" }, ubicacion: { $regex: '.*' + buscar_ubi + '.*', $options: "i" } }, function (error, jobs) {
                    if (error) {
                        console.log('error en el find')
                    }
                })
                .sort({ _id: -1 }).skip((xPage * page) - xPage).limit(xPage).exec((err, jobs) => {
                    Jobs.count((err, count) => {
                        if (err) {
                        } else {
                            res.render('./jobs/lista-trabajos-admin', {
                                categorias,
                                jobs,
                                current: page,
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
        const jobs = await Jobs.find().sort({ _id: -1 }).skip((xPage * page) - xPage).limit(xPage).exec((err, jobs) => {
            Jobs.count((err, count) => {
                if (err) {
                    console.log('error1')
                } else {
                    res.render('./jobs/lista-trabajos-admin', {
                        categorias,
                        tipo_cuenta,
                        jobs,
                        current: page,
                        pages: Math.ceil(count / xPage)
                    })
                }
            })
        })
    } else {
        const xPage = 6;
        const page = req.params.page || 1;
        const categorias = await Categorias.find();
        const jobs = await Jobs.find().sort({ _id: -1 }).skip((xPage * page) - xPage).limit(xPage).exec((err, jobs) => {
            Jobs.count((err, count) => {
                if (err) {
                    console.log('error')
                } else {
            
                    res.render('./jobs/lista-trabajos-admin', {
                        categorias,
                        jobs,
                        current: page,
                        pages: Math.ceil(count / xPage)
                    })
                }
            })
        })
    }


}
userCtrl.renderEditPass = async (req, res) => {
   

     res.render('./users/cambio-pass')
}
userCtrl.renderEditPassUsers = async (req, res) => {
   
    const userid = req.params.id
     res.render('./users/cambio-pass-admin', {userid})
}



userCtrl.eliminarTrabajo = async (req,res)=> {
    const {id} =req.params;


    try {
        const userDelete = await Jobs.findByIdAndDelete(id)
   
        res.redirect('/user/edit-jobs')
        
    } catch (error) {
        console.log(error);
        console.log('error')
    }


}
userCtrl.eliminarTrabajoAdmin = async (req,res)=> {
    const {id} =req.params;
 

    try {
        const userDelete = await Jobs.findByIdAndDelete(id)
  
        res.redirect('/lista-trabajos-admin/1')
        
    } catch (error) {
        console.log(error);
        console.log('error')
    }


}




userCtrl.editPic = async (req, res) => {
    const imgUrl = randomNumber();
    const imageTempPath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    const targetPath = path.resolve(`src/public/uploads/${imgUrl}${ext}`)

    const cvUrl = randomNumber();
    const cvTempPath = req.file.path;
    const extt = path.extname(req.file.originalname).toLowerCase();
    const targetPath_ = path.resolve(`src/public/uploads/${cvUrl}${extt}`)

    if (ext === '.png' || ext === '.jpeg' ||ext === '.jpg' || ext === '.gif' ){
        await fs.rename(imageTempPath, targetPath);

        const newImg = imgUrl+ext

      try {
        const result = await cloudinary.v2.uploader.upload(`src/public/uploads/${newImg}`);

        const imageSaved = await User.findByIdAndUpdate(req.user.id,{$set:{filename:result.url}})

        // await fs.unlink(req.file.path)
        await fs.unlink(targetPath)

      } catch (error) {
          console.log(error)
      } 
      
       // const imageSaved = await User.findByIdAndUpdate(req.user.id,{$set:{filename:newImg}})

    } else if(extt === '.pdf') {

            await fs.rename(cvTempPath, targetPath_);
            const newCv = cvUrl+extt

            try {
                console.log(newCv)
                // const result = await cloudinary.v2.uploader.upload(`src/public/uploads/${newCv}`);
                // console.log(result)
                const cvSaved = await User.findByIdAndUpdate(req.user.id,{$set:{cvfilename:`src/public/uploads/${newCv}`}})
                console.log(cvSaved)
            } catch (error) {
                console.log(error)
            }
         
            
       
    } else {
         await fs.unlink(imageTempPath);
        res.status(500).json({error: 'Solo imagenes son admitidas'});
    }
    
    const user = await User.findById(req.user.id)
    res.render('./users/perfil-user-edit', {user})   
}
userCtrl.editCv = async (req, res) => {

    const cvUrl = randomNumber();
    const cvTempPath = req.file.path;
    const extt = path.extname(req.file.originalname).toLowerCase();
    const targetPath_ = path.resolve(`src/public/uploads/${cvUrl}${extt}`)

    if(extt === '.pdf') { 
        console.log('the path is')
        console.log(cvTempPath)
        console.log(req.file)
        await fs.rename(cvTempPath, targetPath_);
            const newCv = cvUrl+extt
        try {
            const resultCloudCv = await cloudinary.v2.uploader.upload(`src/public/uploads/${newCv}`);
            const cvSaved = await User.findByIdAndUpdate(req.user.id,{$set:{cvfilename:resultCloudCv.url}})
            // const cvSaved = await User.findByIdAndUpdate(req.user.id,{$set:{cvfilename:`/uploads/${req.file.filename}`}})
            const user = await User.findById(req.user.id)
            res.render('./users/perfil-user-edit', {user})  
        } catch (error) {
            console.log(error)
        } 
    } else {
         await fs.unlink(targetPath_);
        res.status(500).json({error: 'Solo pdf son admitidos'});
    }
    
    // const user = await User.findById(req.user.id)
    // res.render('./users/perfil-user-edit', {user})   
}


userCtrl.expeTrabajo = async (req, res) => {
    const expe_traba = {periodo: req.body.periodo_laboral, 
                    titulo_trabajo: req.body.titulo_trabajo,
                    nom_empresa: req.body.nom_empresa,
                    desc_trabajo: req.body.descripcion_trabajo,
                    deta_trabajo: req.body.detalles_trabajo }
    await User.findByIdAndUpdate(req.user.id, {$addToSet: {trabajos: expe_traba}})
    const user = await User.findById(req.user.id)
    res.render('./users/perfil-user-edit', {user})

}

userCtrl.expeEstudios = async  (req, res) => {
    const expe_estu = {periodo: req.body.periodo_estudio,
                        nom_academia: req.body.nom_estudio,
                        deta_estudio: req.body.detalles_estudio}
    await User.findByIdAndUpdate(req.user.id, {$addToSet: {estudios: expe_estu}})
    const user = await User.findById(req.user.id)
    res.render('./users/perfil-user-edit', {user})
}


userCtrl.descargarCv = async (req,res) => {
    const  idUser = await User.findByIdAndUpdate(req.user.id)

}


// userCtrl.paymentMembership = async(req, res) => {
//     const user = await User.findById(req.user.id)
//     if(user.tipo_cuenta === 'Freelancer') {

//         const create_payment_json = {
//             "intent": "sale",
//             "payer": {
//                 "payment_method": "paypal"
//             },
//             "redirect_urls": {
//                 "return_url": "http://localhost:4000/user/sucess",
//                 "cancel_url": "http://localhost:4000/user/cancel"
//             },
//             "transactions": [{
//                 "item_list": {
//                     "items": [{
//                         "name": "Membresia ",
//                         "sku": "001",
//                         "price": "24.00",
//                         "currency": "USD",
//                         "quantity": 1
//                     }]
//                 },
//                 "amount": {
//                     "currency": "USD",
//                     "total": "24.00"
//                 },
//                 "description": "Subscripcion membresia"
//             }]
//         };
//         paypal.payment.create(create_payment_json, function (error, payment) {
//             if (error) {
//                 throw error;
//             } else {
//                 for(let i = 0;i < payment.links.length;i++){
//                   if(payment.links[i].rel === 'approval_url'){
//                     res.redirect(payment.links[i].href);
//                     console.log('EXITO1')
//                   }
//                   console.log('EXITO11')
//                 }
//             }
//           });
//       } else {
//         const create_payment_json = {
//             "intent": "sale",
//             "payer": {
//                 "payment_method": "paypal"
//             },
//             "redirect_urls": {
//                 "return_url": "http://freelance26.herokuapp.com/user/sucess",
//                 "cancel_url": "http://freelance26.herokuapp.com/cancel"
//             },
//             "transactions": [{
//                 "item_list": {
//                     "items": [{
//                         "name": "Membresia Empleador ",
//                         "sku": "001",
//                         "price": "24.00",
//                         "currency": "USD",
//                         "quantity": 1
//                     }]
//                 },
//                 "amount": {
//                     "currency": "USD",
//                     "total": "24.00"
//                 },
//                 "description": "Subscripcion membresia empleador"
//             }]
//         };
//         paypal.payment.create(create_payment_json, function (error, payment) {
//             if (error) {
//                 throw error;
//             } else {
//                 for(let i = 0;i < payment.links.length;i++){
//                   if(payment.links[i].rel === 'approval_url'){
//                     res.redirect(payment.links[i].href);
//                     console.log('OOK')
//                   }
//                   console.log('OO1K')
//                 }
//             }
//           });

//       }     
//     }

// userCtrl.paymentMembership = async(req, res) => {
//     const user = await User.findById(req.user.id)
   
//     }


    

userCtrl.renderListaCandidatosPanel = async (req, res) => {
    if (req.query.buscar_free) {
        if (req.user) {
            const tipo_cuenta = req.user.tipo_cuenta;
            const buscar_free = req.query.buscar_free;
            const xPage = 6;
            const page = req.params.page || 1;
            const applicant = await User.find({ username: { $regex: '.*' + buscar_free + '.*', $options: 'i' }, tipo_cuenta: 'Freelancer' }, function (error, applicant) {
                if (error) {
                    console.log('error en el find')
                }
            })
                .skip((xPage * page) - xPage).limit(xPage).exec((err, applicant) => {
                    User.count({tipo_cuenta: 'Freelancer'}, (err, count) => {
                        if (err) {
                            console.log('error en el conteo')
                        } else {
                            res.render('administracion', { tipo_cuenta, applicant, current: page, pages: Math.ceil(count / xPage) })
                        }
                    })
                })
        } else {
            const buscar_free = req.query.buscar_free;
            const xPage = 6;
            const page = req.params.page || 1;
            const applicant = await User.find({ username: { $regex: '.*' + buscar_free + '.*', $options: 'i' }, tipo_cuenta: 'Freelancer' }, function (error, applicant) {
                if (error) {
                    console.log('error en el find')
                }
            })
                .skip((xPage * page) - xPage).limit(xPage).exec((err, applicant) => {
                    User.count({tipo_cuenta: 'Freelancer'}, (err, count) => {
                        if (err) {
                            console.log('error en el conteo')
                        } else {
                            res.render('administracion', { applicant, current: page, pages: Math.ceil(count / xPage) })
                        }
                    })
                })
        }
    }
    if (req.user) {
        const tipo_cuenta = req.user.tipo_cuenta;
        const xPage = 6;
        const page = req.params.page || 1;
        const applicant = await User.find({ tipo_cuenta: 'Freelancer' }).skip((xPage * page) - xPage).limit(xPage).exec((error, applicant) => {
            User.count({tipo_cuenta: 'Freelancer'}, (error, count) => {
                if (error) {
                    console.log('error1')
                } else {
                    res.render('administracion', {
                        tipo_cuenta, applicant, current: page, pages: Math.ceil(count / xPage)
                    })
                }
            })
        })
    } else {
        const xPage = 4;
        const page = req.params.page || 1;
        const applicant = await User.find({ tipo_cuenta: 'Freelancer' }).skip((xPage * page) - xPage).limit(xPage).exec((error, applicant) => {
            User.count({tipo_cuenta: 'Freelancer'}, (error, count) => {
                if (error) {
                    console.log('error1')
                } else {
                    res.render('administracion', {
                        applicant, current: page, pages: Math.ceil(count / xPage)
                    })
                }
            })
        })
    }
}



userCtrl.createPayment = (req, res) => {

    const body = {
        intent: 'CAPTURE',
        purchase_units: [{
            amount: {
                currency_code: 'USD', //https://developer.paypal.com/docs/api/reference/currency-codes/
                value: '24'
            }
        }],
        application_context: {
            brand_name: `Freelance26.com`,
            landing_page: 'NO_PREFERENCE', // Default, para mas informacion https://developer.paypal.com/docs/api/orders/v2/#definition-order_application_context
            user_action: 'PAY_NOW', // Accion para que en paypal muestre el monto del pago
            return_url: `https://freelance26.herokuapp.com/user/sucess`, // Url despues de realizar el pago
            cancel_url: `https://freelance26.herokuapp.com/` // Url despues de realizar el pago
        }
    }
    //https://api-m.sandbox.paypal.com/v2/checkout/orders [POST]

    request.post(`${PAYPAL_API}/v2/checkout/orders`, {
        auth,
        body,
        json: true
    }, (err, response) => {
        // res.json({ data: response.body })

        for(let i = 0;i < response.body.links.length;i++){
            if(response.body.links[i].rel === 'approve'){
             res.redirect(response.body.links[i].href);
             
        
           }
        }
        // res.json({ data: response.body })
    })
}

// for(let i = 0;i < data.links.length;i++){
    //                   if(data.links[i].rel === 'approve'){
    //                     res.redirect(data.links[i].href);
    //                     console.log('EXITO1')
    //                   }



userCtrl.execute = async (req, res) => {

    const token = req.query.token; //<-----------
    const datos = req.query;
    const status = 'plus'
    const status_basic = 'basico'
    const plusExp = new Date()
    const status_user = await User.findByIdAndUpdate(req.user.id,{$set:{isNewUser:status,plusExpires:plusExp}})
 

    request.post(`${PAYPAL_API}/v2/checkout/orders/${token}/capture`, {
        auth,
        body: {},
        json: true
    }, (err, response) => {
        //  res.json({ data: response.body })
         res.render('users/sucess-membresia', {status_user,datos});
            
      

    })
}




//Exportando Modulo
module.exports = userCtrl;


