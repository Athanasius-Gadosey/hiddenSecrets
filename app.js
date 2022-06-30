// jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const bcrypt = require('bcrypt');
const saltRounds = 12;

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

// Session for express initial configuration
app.use(session({
    secret: 'Our Worries', 
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true});
mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema ({
    email: String,
    password: String,
    secret: String
});

// passportLocalMongoose config
userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model('User', userSchema);

// passportLocalMongoose configuration
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get('/', function(req, res){
    res.render('home');
});

app.get('/login', function(req, res){
    res.render('login');
});

app.get('/register', function(req, res){
    res.render('register');
});

app.get('/secrets', function(req, res){
    User.find({'secret': {$ne: null}}, function(err, foundUsers){
        if(err){
            console.log(err);
        }
        else{
            if(founderUsers){
                res.prependOnceListener('secrets', {usersWithSecrets: foundUsers});
            }
        }
    });
});

// Submit Route
app.get('/submit', function(req, res){
    if(req.isAuthenticated()){
        res.render('submit');
    }
    else {
        res.redirect('/login');
    }
});

app.post('/submit', function(req, res) {
    const submittedSecret = req.body.secret;

    console.log(req.user.id);

    User.findById(req.user.id, function(err, foundUser){
        if(err){
            console.log(err)
        }
        else{
            if (foundUser){
                foundUser.secret = submittedSecret;
                foundUser.save(function(){
                    res.redirect('secrets');
                });
            }
        }
    });
});

// Register Route
app.post('/register', function(req, res){
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect('/register');
        }
        else{
            passport.authenticate('local') (req, res, function(){
                res.redirect('/secrets');
            });
        }
    });

});

// Login Route
app.post('/login', function(req, res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err){
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate('local') (req, res, function(){
                res.redirect('/secrets');
            });
        }
    });
});

// Logout route
app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});

//this is shows the ports server
app.listen(4000, function(){
    console.log('Ports run on 4000');
});