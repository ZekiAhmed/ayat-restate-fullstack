import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

export const register = async (req, res) => {
  const { username, email, password } = req.body;

  // HASH THE PASSWORD
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(hashedPassword);
    console.log(req.body);

    // CREATE A NEW USER AND SAVE TO DB
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    console.log(newUser);

    res.status(200).json({ message: "User created successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to create user!" });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // CHECK IF THE USER EXISTS
    const user = await prisma.user.findUnique({
      where: { username: username }, // or u can where:{username}
    });

    if (!user) return res.status(401).json({ message: "Invalid Credentials!" });

    // CHECK IF THE PASSWORD IS CORRECT
    const isPassowerdValid = await bcrypt.compare(password, user.password);
    if (!isPassowerdValid)
      return res.status(401).json({ message: "Invalid Credentials!" });
    // GENERATE COOKIE TOKEN AND SEND TO THE USER
    // res.setHeader("Set-Cookie", "test=" + "myValue").json("success");

    const age = 1000 * 60 * 60 * 24 * 7;

    const token = jwt.sign(
      {
        id: user.id,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: age }
    );

    res
      .cookie("token", token, {
        httpOnly: true,
        // secure: true,
        maxAge: age,
      })
      .status(200)
      .json({ message: "Login Successful" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to login!" });
  }
};

export const logout = (req, res) => {
  res.clearCookie("token").status(200).json({ message: "Logout Successful" });
};
