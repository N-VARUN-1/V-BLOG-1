import User from '../models/user.model.js';
import bcryptjs from 'bcryptjs'
import { errorHandler } from '../utils/error.js';
import jwt from 'jsonwebtoken';

export const secretKey = 'v-blog-secret-key';              // need to fetch this key from the .env file

export const signup = async (req, res, next) => {
    // console.log(req.body)
    const {username, email, password} = req.body;

    if(!username || !email || !password || username === '' || email === '' || password === ''){
        next(errorHandler(400, 'All fields are required!'))
    }

    const hashedPassword = bcryptjs.hashSync(password, 10)

    const newUser = new User({username, email, password: hashedPassword});
    try{
        await newUser.save();
        res.json("Sign Up successful"); 
    }catch(error){
        next(error);
    }
}

export const signin = async (req, res, next) => {
     const {email, password} = req.body;

     if(!email || !password || email === '' || password === '') {
        return next(errorHandler(400, 'All fields are required!'))
     }

     try{
        const validUser = await User.findOne({email});
        if(!validUser){
            return next(errorHandler(404, 'User not found!'))
        }
        const isValidPassword = bcryptjs.compareSync(password, validUser.password);
        if(!isValidPassword){
            return next(errorHandler(400, 'Invalid Password'))
        }

        const token = jwt.sign({ id: validUser._id, isAdmin: validUser.isAdmin }, secretKey);

        const {password: pass, ...rest} = validUser._doc;

        res.status(200).cookie('access_token', token, {
            httpOnly: true,
        }).json(rest)
     }catch(error){
        next(error);
     }
};

export const google = async(req,res,next)=>{
     const {name, email, googlePhotoURL} = req.body;
     try{
        const user = await User.findOne({email});
        if(user){
            const token = jwt.sign({id: user._id, isAdmin: user.isAdmin}, secretKey);
            const {password: pass, ...rest} = user._doc;
            res.status(200).cookie('access_token', token,{
                httpOnly: true,
                }).json(rest);
        }else{
            const generatePassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
            const hashedPassword = bcryptjs.hashSync(generatePassword, 10);
            const newUser = new User({
                username: name.toLowerCase().split(' ').join(''), 
                email, 
                password: hashedPassword,
                profilePicture: googlePhotoURL});
                await newUser.save();
                const token = jwt.sign({id: newUser._id, isAdmin: newUser.isAdmin}, secretKey);
                const {password: pass, ...rest} = newUser._doc;
                res.status(200).cookie('access_token', token,{
                    httpOnly: true,
                    }).json(rest);
        }
     }catch(error){
        next(error);
     }
}