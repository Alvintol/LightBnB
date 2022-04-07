const properties = require('./json/properties.json');
const users = require('./json/users.json');
const { Pool } = require('pg');
const query = require('express/lib/middleware/query');


const args = process.argv.slice(2);


const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

pool.query(`SELECT title FROM properties LIMIT 10;`).then(response => {

});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {

  return pool
    .query(`
      SELECT * FROM users
      WHERE email = $1`, [email])
    .then((result) => {
      return result.rows[0]
    })
    .catch((err) => {
      console.log(err.message)
      return null
    });
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
  return pool
    .query(`
      SELECT * FROM users
      WHERE id = $1
      LIMIT 1`, [id])
    .then((result) => {
      return result.rows[0]
    })
    .catch((err) => {
      console.log(err.message)
      return null
    });
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
  return pool
    .query(`
    INSERT INTO users (name, email, password) 
    VALUES ($1, $2, $3); 
      `, [user.name, user.email, user.password])
    .then((result) => {
      console.log(user)
      return result.rows[0].id
    })
    .catch((err) => {
      console.log(err.message)
      return null
    });
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  return pool
    .query(`
    SELECT properties.*, 
    AVG(rating) AS average_rating, reservations.*
    FROM properties
    JOIN reservations ON properties.id=reservations.property_id
    JOIN property_reviews ON properties.id=property_reviews.property_id
    WHERE reservations.guest_id = $1
    GROUP BY properties.id, reservations.id
    ORDER BY reservations.start_date
    LIMIT $2
    `, [guest_id, limit])
    .then((result) => {
      return result.rows
    })
    .catch((err) => {
      console.log(err.message)
      return null
    });
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */

const getAllProperties = (options, limit = 10) => {

  const queryParams = [];
  
  

  let queryString = `
    SELECT properties.*, avg(property_reviews.rating) as average_rating
    FROM properties
    JOIN property_reviews ON properties.id = property_id
    `;
  

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }

  if (!options.city && options.minimum_price_per_night) {
    queryParams.push(`${options.minimum_price_per_night}`);
    queryString += `WHERE cost_per_night > $${queryParams.length} `;
  }

  if (options.city && options.minimum_price_per_night) {
    queryParams.push(`${options.minimum_price_per_night}`);
    queryString += ` AND cost_per_night > $${queryParams.length} `;
  }

  if (!options.city && !options.minimum_price_per_night && options.maximum_price_per_night) {
    queryParams.push(`${options.maximum_price_per_night}`);
    queryString += `WHERE cost_per_night < $${queryParams.length} `;
  }
  if ((options.city || options.minimum_price_per_night) && options.maximum_price_per_night) {
    queryParams.push(`${options.maximum_price_per_night}`);
    queryString += ` AND cost_per_night < $${queryParams.length} `;
  }
  
    if (options.owner_id) {
      queryParams.push(`${options.owner_id}`);
      queryString += `
      WHERE owner_id = $${queryParams.length} `;
    }
  
  queryString += `
  GROUP BY properties.id `;
  
  if (options.minimum_rating) {
    queryParams.push(`${options.minimum_rating}`);
    queryString += `
    HAVING AVG(property_reviews.rating) >= $${queryParams.length} `;
  }

  queryString += `
  ORDER BY cost_per_night`;
  
  if (limit) {
    queryParams.push(limit);
    queryString += `
    LIMIT $${queryParams.length};
    `;
  }

  console.log(queryString, queryParams);

  return pool.query(queryString, queryParams).then((res) =>  res.rows)
    .catch((err) => {
      console.log(err.message);
    });
};

exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
}
exports.addProperty = addProperty;
