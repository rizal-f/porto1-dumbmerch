// import model
const { user, profile } = require("../../models");

// import joi validation untuk memvalidasi data input
const Joi = require("joi");
// import bcrypt untuk mengenkripsi password
const bcrypt = require("bcrypt");
//import jsonwebtoken untuk mengenerate token untuk login
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  // our validation schema here skema input untuk register
  const schema = Joi.object({
    name: Joi.string().min(3).required(),
    email: Joi.string().email().min(6).required(),
    password: Joi.string().min(6).required(),
  });

  // do validation and get error object from schema.validate || jika data input tidak sesuai skema
  const { error } = schema.validate(req.body);

  // if error exist send validation error message || untuk mengrimkan status error
  if (error)
    return res.status(400).send({
      error: {
        message: error.details[0].message,
      },
    });

  try {
    // we generate salt (random value) with 10 rounds || men-generate enkripsi password 10x hashing password
    const salt = await bcrypt.genSalt(10);
    // we hash password from request with salt
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const newUser = await user.create({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      status: "customer",
    });

    const newProfile = await profile.create({
      phone: null,
      gender: null,
      address: null,
      idUser: newUser.id,
      image: "default-user.png",
    });

    // generate token
    const token = jwt.sign({ id: user.id }, process.env.TOKEN_KEY);

    res.status(200).send({
      status: "success...",
      data: {
        name: newUser.name,
        email: newUser.email,
        token,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      status: "failed",
      message: "Server Error",
    });
  }
};

exports.login = async (req, res) => {
  // joi validation-----------------------------------------------
  // our validation schema here
  const schema = Joi.object({
    email: Joi.string().email().min(6).required(),
    password: Joi.string().min(6).required(),
  });

  // do validation and get error object from schema.validate
  const { error } = schema.validate(req.body);

  // if error exist send validation error message
  if (error)
    return res.status(400).send({
      error: {
        message: error.details[0].message,
      },
    });
  // joi validation-----------------------------------------------
  // function sequelize------------------------------------------
  try {
    const userExist = await user.findOne({
      where: {
        email: req.body.email,
      },
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });
    // compare password between entered from client and from database || mengcompare password yang di input dengan pasword yang sudah dibcrypt
    const isValid = await bcrypt.compare(req.body.password, userExist.password);

    // check if not valid then return response with status 400 (bad request)
    if (!isValid) {
      return res.status(400).send({
        status: "failed",
        message: "credential is invalid",
      });
    }

    // generate token
    const token = jwt.sign({ id: userExist.id }, process.env.TOKEN_KEY);

    res.status(200).send({
      status: "success...",
      data: {
        id: userExist.id,
        name: userExist.name,
        email: userExist.email,
        status: userExist.status,
        token,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      status: "failed",
      message: "Server Error",
    });
  }
};
// function sequelize------------------------------------------

// function for cek auth
exports.checkAuth = async (req, res) => {
  try {
    const id = req.user.id;

    const dataUser = await user.findOne({
      where: {
        id,
      },
      attributes: {
        exclude: ["createdAt", "updatedAt", "password"],
      },
    });

    if (!dataUser) {
      return res.status(404).send({
        status: "failed",
      });
    }

    res.send({
      status: "success...",
      data: {
        user: {
          id: dataUser.id,
          name: dataUser.name,
          email: dataUser.email,
          status: dataUser.status,
        },
      },
    });
  } catch (error) {
    console.log(error);
    res.status({
      status: "failed",
      message: "Server Error",
    });
  }
};
