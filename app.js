require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const passport = require("passport");
const session = require("express-session");
const findOrCreate = require('mongoose-findorcreate');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const _ = require("lodash");


const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));


app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/messengerDB")
    .catch(err => console.log(err));

const messageSchema = new mongoose.Schema({
    messageTime: String,
    reciever: String,
    sender: String,
    subject: String, 
    content: String
});

const Message = mongoose.model("message", messageSchema);

const userSchema = new mongoose.Schema({
    name: String,
    password: String,
    inbox: [messageSchema],
    outbox: [messageSchema],
})

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("user", userSchema);

passport.use(User.createStrategy())

passport.serializeUser((user, cb) => {
    process.nextTick(() => {
      cb(null, { id: user.id, username: user.username });
    });
  });
  
  passport.deserializeUser((user, cb) => {
    process.nextTick(() => {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/messenger",
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

// Date

const date = new Date()

const options = {
    day: "numeric",
    weekday: "short",
    month: "short"
}

// End of date

app.get("/", (req, res) => res.render("index"));

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
})

app.get("/dashboard", (req, res) =>{
    if (req.isAuthenticated()) {
        res.render("dashboard");
    } else {
        res.redirect("/login");
    }
})

app.get("/compose", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("compose");
    } else {
        res.redirect("/login");
    }
});

app.get("/auth/google",
  passport.authenticate("google", { scope:
      [ "profile" ] }
));

app.get('/auth/google/messenger', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/dashboard');
  });

  app.get("/inbox", (req, res) => {
    if (req.isAuthenticated()) {
        User.findById(req.user.id)
            .then(foundUser => {
                res.render("inbox", {inboxMessages: foundUser.inbox})
            });
    } else {
        res.redirect("/login");
    }

  });

  app.get("/outbox", (req, res) => {
    if (req.isAuthenticated()) {
        User.findById(req.user.id)
            .then(foundUser => {
                res.render("outbox", {outboxMessages: foundUser.outbox})
            })
    } else {
        res.redirect("/login");
    }
  });

  app.get("/inbox/:clickedMessage", (req, res) => {

    User.findById(req.user.id)
        .then(foundUser => {
            const requestedMessage = _.find(foundUser.inbox, {id: req.params.clickedMessage});
            res.send(requestedMessage);
        });
  });

  app.get("/outbox/:clickedMessage", (req, res) => {

    User.findById(req.user.id)
        .then(foundUser => {
            const requestedMessage = _.find(foundUser.outbox, {id: req.params.clickedMessage});
            res.send(requestedMessage);
        });
  })

app.post("/register", (req, res) => {

    User.register({username: req.body.username}, req.body.password, (err, newUser) => {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/dashboard");
            });
        }
    })
});

app.post("/login", (req, res) => {

    const user = new User({
        username: req.body.username,
        password: req.body.password,
    });

    req.login(user, err => {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/dashboard");
            })
        }
    })
    
});

app.get("/logout", (req, res) => {
    req.logOut(req.user, err => {
        if(err) {
            console.log(err);
        }
        res.redirect("/");
    });
})

app.post("/compose", (req, res) => {
    const today = date.toLocaleDateString("en-Us", options);

    const message = new Message({
        reciever: req.body.reciever,
        sender: req.user.username,
        subject: req.body.subject,
        content: req.body.content,
        messageTime: today
    });

    User.findByUsername(req.body.reciever)
        .then(foundReciever => {
            foundReciever.inbox.push(message);
            foundReciever.save()
                .then(
                    User.findById(req.user.id)
                        .then(foundSender => {
                            foundSender.outbox.push(message);
                            foundSender.save();
                            
                            res.redirect("/outbox");
                        })
                )
                .catch(err => console.log(err));
        })
        .catch(err => console.log(err));
})

app.listen(3000, () => console.log("Listening at port 3000!"));