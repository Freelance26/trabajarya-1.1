//Modulos requeridos
const express = require('express');
const User = require("../models/Users");
const {randomNumber} = require('../helpers/libs');
const Post = require("../models/PostBlog");
const  fs  = require('fs-extra');

const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary')

const router = express.Router();

//Controlador
const  { renderBlog, 
         renderBlogDetalles,
         renderPoliticaDePrivacidad,
         renderTerminosYCondiciones,
         renderPoliticasDeFreelance26 } = require('../controllers/blog.controller');
const { isAuthenticated } = require('../helpers/auth');

//Ruta Blogs
// router.get('/blog', renderBlog);

//Ruta Blog
router.get('/blog/article/:id', renderBlogDetalles);

//Ruta Política de privacidad
router.get('/blog/politica-de-privacidad', renderPoliticaDePrivacidad);

//Ruta Términos y condiciones
router.get('/blog/terminos-y-condiciones', renderTerminosYCondiciones);

//Ruta Políticas de freelance26
router.get('/blog/politicas-de-trabajarya', renderPoliticasDeFreelance26);



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
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});


router.get('/blog-write' ,isAuthenticated, async (req,res) => {
  res.render('./blog/blog-write')
});
//CREATE POST
router.post("/blog", upload.single('photo'), async (req, res) => {


  const user = await User.findById(req.body.idAuthor)

  console.log(user)

  const imgUrl = randomNumber();
  const imageTempPath = req.file.path;
  const ext = path.extname(req.file.originalname).toLowerCase();
  const targetPath = path.resolve(`src/public/uploads/${imgUrl}${ext}`)

  if (ext === '.png' || ext === '.jpeg' ||ext === '.jpg' || ext === '.gif' ) { 
    await fs.rename(imageTempPath, targetPath);

    const newImg = imgUrl+ext

    try {
      const result = await cloudinary.v2.uploader.upload(`src/public/uploads/${newImg}`);

      req.body.photo = result.url
      const newPost = new Post(req.body);
      const savedPost = await newPost.save();
      console.log(savedPost)
      res.status(200).json(savedPost);
      await fs.unlink(targetPath)

    } catch (error) {
        console.log(error)
        res.status(500).json(err);
    } 

  }

});

  // const newPost = new Post(req.body);
  // try {
  //   const savedPost = await newPost.save();
  //   res.status(200).json(savedPost);
  // } catch (err) {
  //   res.status(500).json(err);
  // }

//UPDATE POST
router.put("/blog/update/:id",upload.single('photo'), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    console.log(req.body)
    // try {
    //   const updatedPost = await Post.findByIdAndUpdate(
    //     req.params.id,
    //     {
    //       $set: req.body,
    //     },
    //     { new: true }
    //   );
    //   res.status(200).json(updatedPost);
    // } catch (err) {
    //   res.status(500).json(err);
    // }
    // if (post.username === req.body.username) {
    if (post.idAuthor === req.body.userId) {
      try {
        const updatedPost = await Post.findByIdAndUpdate(
          req.params.id,
          {
            $set: req.body,
          },
          { new: true }
        );
        res.status(200).json({msg:"success"});
      } catch (err) {
        res.status(500).json({err:err});
      }
    } else {
      res.status(401).json("You can update only your post!");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

//DELETE POST
router.delete("/blog/:id",upload.single('photo'), async (req, res) => {
  try {
    console.log(req.body)
    const post = await Post.findById(req.params.id);
    // if (post.username === req.body.username) {
    if (post.idAuthor === req.body.userId) {
      try {
        await post.delete();
        res.status(200).json("Post has been deleted...");
      } catch (err) {
        res.status(500).json(err);
      }
    } else {
      res.status(401).json("You can delete only your post!");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET POST
router.get("/blog/:id", async (req, res) => {
  try {
    console.log('ok')
    console.log(req.params.id)
    const post = await Post.findById(req.params.id);
    console.log(post)
    if (req.user) {

      if (req.user.tipo_cuenta === 'Admin') { 
        let isAdmin = true;
        res.render('./blog/detalles-blog', {post,isAdmin})   
      } else {
        res.render('./blog/detalles-blog', {post})   
      }
    } else {
      let isAdmin = false;
      res.render('./blog/detalles-blog', {post,isAdmin}) 
    }

    // res.status(200).json(post);
  } catch (err) {
    res.status(500).json(err);
  }
});
router.get("/blog/update/:id", async (req, res) => {
  try {
    console.log('ok')
    console.log(req.params.id)
    const post = await Post.findById(req.params.id);
    res.render('./blog/blog-write-update', {post})  
    // res.status(200).json(post);
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET ALL POSTS
router.get("/blog", async (req, res) => {
  const username = req.query.user;
  const catName = req.query.cat;
  try {
    let posts;
    if (username) {
      posts = await Post.find({ username });
    } else if (catName) {
      posts = await Post.find({
        categories: {
          $in: [catName],
        },
      });
    } else {
      posts = await Post.find();
    }
    console.log(posts)
    res.render('./blog/blog', {posts:posts}) 
    // res.status(200).json(posts);
  } catch (err) {
    res.status(500).json(err);
  }
});




//Exportando modulo
module.exports = router;