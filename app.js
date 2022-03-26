const express = require("express"),
    app = express(),
    flash = require("connect-flash")

const nodemailer = require("nodemailer")
const bodyParser = require('body-parser')


app.use(bodyParser.urlencoded({ extended: true }))
app.use(flash());

app.set("view engine", "ejs")
//app.set('port', (process.env.PORT || 80))
app.use(express.static(__dirname + '/public'))

// Middleware to pass current user for all routes
app.use(require("express-session")({
    secret: "Them baggy sweatpants and the reeboks with the straps",
    resave: false,
    saveUninitialized: false
}));
app.use((req, res, next) => {
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
})

// Routes
app.get("/", function (req, res) {
    res.render("landing")
})

app.get("/contact", function (req, res) {
    res.render("contact");
});

// POST route from contact form
app.post('/contact', (req, res) => {

    // Instantiate the SMTP server
    const smtpTrans = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS
        }
    })

    // Specify what the email will look like
    const mailOpts = {
        from: `${req.body.name}`, // This is ignored by Gmail
        to: process.env.GMAIL_USER,
        subject: 'New Msg: findingfarmers.com/contact',
        text: `${req.body.name} <${req.body.email}> \n${req.body.message}`
    }

    // Attempt to send the email
    smtpTrans.sendMail(mailOpts, (error, response) => {
        if (error) {
            req.flash('error', 'contact-failure') // Show a notice indicating failure
            res.redirect("/contact")
        }
        else {
            req.flash('success', 'Message Sent!') // Show a notice indicating success
            res.redirect("/contact")
        }
    })
})

app.listen(5000, function () {
    console.log("Node app is running at localhost:" + 5000)
})
