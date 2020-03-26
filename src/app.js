require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const { NODE_ENV } = require('./config')
const app = express()
const uuid = require('uuid/v4')
const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

app.use(express.json())
app.use(morgan(morganOption))
app.use(helmet())
app.use(cors())

const contacts = []
const token = process.env.API_TOKEN

app.use(validateAuthorization)
app.use((error, req, res, next) => {
  let message
  if (NODE_ENV === 'production') {
    message = 'Server error'
  }
  else {
    console.error(error)
    message = error.message
  }
  res.status(500).json(message)
})

function validateAuthorization(req, res, next) {
  const API_TOKEN = process.env.API_TOKEN;
  const authValue = req.get('Authorization');

  if (authValue === undefined) {
    return res.status(400).json({ error: 'Authorization header missing' });
  }

  if (!authValue.toLowerCase().startsWith('bearer ')) {
    return res.status(400).json({ error: 'Invalid Authorization method: Must use Bearer strategy' });
  }

  const token = authValue.split(' ')[1];

  if (token !== API_TOKEN) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  next();
}

app.get('/address', (req, res) => {
  res.send(contacts)
})

function handlePost (req, res) {
  const { firstName, lastName, address1, address2, city, state, zip } = req.body;

  console.log(token)

  if(!firstName) {
    return res
    .status(400)
    .send('First Name required');
  }

  if(!lastName) {
    return res
    .status(400)
    .send('Last Name required');
  }

  if(!address1) {
    return res
    .status(400)
    .send('Address is required');
  }

  if(!city) {
    return res
    .status(400)
    .send('City is required');
  }

  if(!state) {
    return res
    .status(400)
    .send('State required');
  }

  if(state.length !== 2){
    return res
    .status(400)
    .send('State must be a two-letter state code')
  }

  if(!zip) {
    return res
    .status(400)
    .send('Zip Code required');
  }

  if(zip.length !== 5) {
    return res
    .status(400)
    .send('Zip Code must be 5 digits');
  }

  if(parseInt(zip) === undefined) {
    return res
    .status(400)
    .send('Zip Code must be a number');
  }

  const id = uuid()
  const newContact = {
    id,
    firstName,
    lastName,
    address1,
    address2,
    city,
    state,
    zip
  } 

  contacts.push(newContact)

  res.json({ id: id })
}

app.post('/address', validateAuthorization, handlePost)

function handleDelete(req, res) {
  const { id } = req.params

  const index = contacts.findIndex(c => c.id === id)

  if (index === -1){
    return res  
      .status(404)
      .send('User not found')
  }

  contacts.splice(index, 1)

  res.status(204).end()

}

app.delete('/address/:id', validateAuthorization, handleDelete)

module.exports = app