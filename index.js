const express = require('express');
const rateLimit = require('express-rate-limit');
const Queue = require('bull');
const redis = require('redis');
const moment = require('moment');

const app = express();
const PORT = 8000;
const apiQueue = new Queue('apiQueue');

const apiCallLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 15, 
  
 
});
const redisClient = redis.createClient();

const rateLimiter = (req, res, next) => {
  const ip = req.ip;

  redisClient.multi()
    .incr(ip)
    .expire(ip, 60) 
    .get(ip)
    .exec((err, replies) => {
      if (err) {
        return res.status(500).send('Server error');
      }

      const requestCount = replies[2];

      if (requestCount > 15) {
         handler: (_, res) => { 
    res.status(429).send('Too many requests, please try again later.');
}
        return res.status(429).send('Too many requests, please try again later.');
      }

      next();
    });
};

app.use('/api', apiCallLimiter);
apiQueue.process(async (job, done) => {
    const { input, res } = job.data;
    const data = call_me(input);
    res.json(data);
    done();
  });
  app.use('/api', rateLimiter);
  app.get('/', (req, res) => {
    const now = moment().format(); 
    console.log('Current date and time:', now); 
    console.log('Request object:', req); 
    res.send(`Welcome to the API server. Current date and time: ${now}`);
  });

app.get('/api/data', (req, res) => {
  const data = call_me(req.query.input);
  res.json(data);
});

function call_me(input) {
  return { success: true, input };
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
