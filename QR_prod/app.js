var express = require('express');
//require('monitor-dashboard').start();
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');

var passport = require('passport');
var passportlocal = require('passport-local')

var flash = require('connect-flash');

var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

var moment = require('moment'); // For time format

console.log('[1] -> Starting Express');

var app = express();

var transport = nodemailer.createTransport(smtpTransport({
    host: 'example.com',
    port: 25
}));

console.log('[2] -> SMTP Configured');

var users = [
    { id: 1, username: 'user1', password: 'pass1', name: 'User Namme1', email: 'user1@examle.com' }
  , { id: 2, username: 'user2', password: 'pass2', name: 'User Namme2', email: 'user2@examle.com' }

];

function findById(id, fn) {
  var idx = id - 1;
  if (users[idx]) {
    fn(null, users[idx]);
  } else {
    fn(new Error('User ' + id + ' does not exist'));
  }
}

function findByUsername(username, fn) {
  for (var i = 0, len = users.length; i < len; i++) {
    var user = users[i];
    if (user.username === username) {
      return fn(null, user);
    }
  }
  return fn(null, null);
}
app.use(express.static( "public" ) );
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('ejs', require('ejs-locals'));

app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(expressSession({ secret: process.env.SESSION_SECRET || 'FlB3578_20014@',
	resave: false,
	saveUninitialized: false

}));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());


passport.use(new passportlocal.Strategy(function(username, password, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
      // Find the user by username.  If there is no user with the given
      // username, or the password is not correct, set the user to `false` to
      // indicate failure and set a flash message.  Otherwise, return the
      // authenticated `user`.
      findByUsername(username, function(err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
        if (user.password != password) { return done(null, false, { message: 'Invalid password' }); }
        return done(null, user);
      })
    });
	
}));

passport.serializeUser(function(user, done) {
	done(null, user.id);
});

passport.deserializeUser(function(id, done) {
	//QUERY database or cache 
	findById(id, function (err, user) {
    done(err, user);
  });
});

// ROUTES
app.get('/', function(req, res) {
	res.render('index', {
		isAuthenticated: req.isAuthenticated(),
		user: req.user
	});
});

app.get('/account', ensureAuthenticated, function(req, res) {
  res.render('account', {
        isAuthenticated: req.isAuthenticated(),
        user: req.user
  });
});

app.get('/login', function(req, res){
  res.render('login', { user: req.user, message: req.flash('error') });
});

app.get('/template', function(req, res){
  res.send(searchTemplate(req.query.templateID));
});   
/*
app.post('/login', passport.authenticate('local', //function(req, res) {
	{ failureRedirect: '/login',
	successRedirect: '/',
	failureFlash : true
	//res.redirect('/');
}));
*/

app.post('/login', passport.authenticate('local', //function(req, res) {
	{ failureRedirect: '/login',
	successRedirect: '/',
	failureFlash : true
	//res.redirect('/');
}));

app.get('/esend', function(req,res){
  //var d = new Date();
  var message = {
      from: req.query.from,
      to : req.query.to,
      cc : req.query.cc,
      subject : req.query.subject,
      headers: {
        'X-Laziness-level': 1000
      },
      text : req.query.text
  };
  //console.log('[' + moment().format('DD.MM.YYYY HH:mm:ss') +'] Sending Mail');

  transport.sendMail(message, function(error, info) {
    if (error) {
      console.log('[' + moment().format('DD.MM.YYYY HH:mm:ss') +'] Error occurred');
      console.log(error.message);
      res.end('error');
    } else {
      console.log('[' + moment().format('DD.MM.YYYY HH:mm:ss') +'] Message sent successfully!');
      console.log('[' + moment().format('DD.MM.YYYY HH:mm:ss') +'] Server responded with "%s"', info.response);
      res.end('{"success" : "Successfully sent", "status" : 200}');
    }
  })

});

app.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err) }
    if (!user) {
      req.flash('error', info.message);
      return res.redirect('/login')
    }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      return res.redirect('/');
    });
  })(req, res, next);
});




app.get('/logout', function(req,res) {
	req.logout(); // Passport ficha
	res.redirect('/');
});

var port = process.env.PORT || 3000;

app.listen(port, function() {
	console.log('[Ok] - Server is running on http://uaievad7:' + port + '/');
});


function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}
function searchTemplate(code) {
switch (code) {
    case '1':
      output = 'Пакування пошти' + '\n'
        + 'Підготовка техніки/листа до транспортування адресату. Біркування пошти ' 
        + 'відповідною наклейкою та позначеннями. Обертання пакунка скотчем.'
        + 'Передача пошти секретарю рецепції.';
    break
    case '2': 
      output = 'Забір/розбір пошти' + '\n'
        + 'Прийом пошти від секретарю рецепції. Сортування. Розпаковка пакунка. ' 
        + 'Ідентифікація листа чи пакунка.'
        + 'Передача відповідальній особі.';
    break
    case '3':
     output = 'Адіністративна робота.' + '\n'
        + 'Рахунки. Акти. Договора. Підготовка документації. Збір підписів. Простановка мокрої печатки.' 
        + ' Передача/забір документів у відповідних служб. Уточнення, прискорення проплати в Finance.'
        + ' Проведення інвентиризацій техніки. Оформлення списань.'
        ;
    break
    case '4':
     output = 'Адіністративна робота.PO' + '\n'
        + ' Питання створення нового матеріалу та вендору. Cтворення Purchase requesition. ' 
        + ' Отримання схвалення керівником IT. Комунікація с PR відділом, щодо створення'
        + ' PO. Контроль і пітвердження на рівнях PO.FA.CFO. Комунікація постачальнику.';
    break
     case '5':
     output = 'OFF.Консультація' + '\n'
        + 'Ідентифікація звернення. Надання нагальної і вичерпної ' 
        + 'інформації, щодо роботи системи OFF. Допомога у підключенні Datasource.'
        + 'Пошук та виправлення помилок. Нагальне оновлення і завантаження інформації.'
        + 'Складання технчіної документації та листів з поясненнями';
    break
    case '6':
      output = 'TVonGo.Консультація' + '\n'
        + 'Ідентифікація звернення. Надання нагальної і вичерпної ' 
        + 'інформації, щодо роботи системи  TV on Go. Виправлення помилок у контенті.'
        + 'Перезавантаження серверу. Налаштування панелей та скриптів.'
        + 'Складання технчіної документації та листів з поясненнями';
    break
    case '7':
      output = 'HHT. iPAD.' + '\n'
        + 'Заміна, оперативний ремонт техніки, видача нової техніки ' 
        + 'та комплектуючих. Складання актів прийому-передачі.';
    break
    case '8':
      output = 'Постачальники' + '\n'
        + 'Робота с постачальник. Комунікації. Супроводження.' 
        + 'Вирішення їх проблем.';
    break
    case '9':
      output = 'Інші питання' + '\n'
        + 'Любий спектр питань. Наприклад: Картриджі. Патчкорди, телефонія, комплектуючі,'
        + ' зв\'язок, доступи. Просто не працює. Користувач бажає поспілкуватися з IT. '
        ;
    break
    default: output='';
    break
  }
  return output;
}
