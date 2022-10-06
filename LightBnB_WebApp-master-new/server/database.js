const properties = require('./json/properties.json');
const users = require('./json/users.json');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'labber',
  password: '123',
  host: 'localhost',
  database: "lightbnb"
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  values = [email]
  return pool.query(`SELECT * FROM users WHERE email = $1`, values)
  .then(res => {
    if(res.rows.length === 0) {
      return null;
    }
    return res.rows[0];

  })
  .catch(err => {
    console.log(err);
  })
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {

  return pool.query(`SELECT * FROM users WHERE id = $1`, [id])
  .then(res => res.rows[0] || null)
  .catch(err => console.log(err));
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
 const addUser = function(user) {
  const values = [user.name, user.email, user.password]
  return pool.query(`INSERT INTO users(name, email, password) VALUES ($1, $2, $3) RETURNING *;`, values)
  .then(res => res.rows[0] || null)
  .catch(err => {
    console.log(err)
  })
};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  const values = [guest_id, limit]
  const queryString = `SELECT properties.*, reservations.*, avg(rating) as average_rating FROM reservations
  JOIN properties ON reservations.property_id = properties.id
  JOIN property_reviews ON properties.id = property_reviews.property_id
  WHERE reservations.guest_id = $1
  AND reservations.end_date < now()::date
  GROUP BY properties.id, reservations.id
  ORDER BY reservations.start_date
  LIMIT $2;`;
  return pool.query(queryString, values)
  .then(res => {
    return res.rows;
  })
  .catch(err => {
    return console.log(err)
  })
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
 const getAllProperties = function (options, limit = 10) {
  // 1
  const queryParams = [];
  // 2
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  WHERE 1=1
  `;

  // 3
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `AND city LIKE $${queryParams.length}`;
  }

  if(options.owner_id){
    queryParams.push(`${options.owner_id}`);
    queryString += `AND owner_id = $${queryParams.length}`
  }



  if (options.minimum_price_per_night) {
    queryParams.push(`${Number(options.minimum_price_per_night)}`);
    queryString += ` AND cost_per_night > $${queryParams.length}`
  }

  if (options.maximum) {
    queryParams.push(`${Number(options.maximum)}`);
    queryString += ` AND cost_per_night < $${queryParams.length}`
  }

  if (options.minimum_rating) {
    queryParams.push(`${Number(options.minimum_rating)}`);
    queryString += ` AND rating > $${queryParams.length}`
  }

  // 4
  queryParams.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

// 5 Console log everything just to make sure we've done it right.
console.log(queryString, queryParams);

// 6 Run the query.
return pool.query(queryString, queryParams)
.then(res => res.rows);
};
 
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const values = Object.values(property);
  const keys = Object.keys(property);
  return pool.query(`INSERT INTO properties (${keys.join(',')})
  VALUES($1, $2, $3, $4, $5, $6, $7, $8 , $9, $10, $11, $12, $13, $14) RETURNING*;`, values)
  .then( res => {
    return res.rows;
  })
}
exports.addProperty = addProperty;
