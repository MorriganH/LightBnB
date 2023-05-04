const properties = require("./json/properties.json");
const users = require("./json/users.json");
const { Pool } = require('pg');

const pool = new Pool({
  user: 'labber',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
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
      SELECT *
        FROM users
       WHERE email = $1;
    `, [email])
    .then(res => res.rows[0])
    .catch(err => console.log(err.message));
};

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
  return pool
    .query(`
      SELECT *
        FROM users
       WHERE id = $1;
     `, [id])
     .then(res => res.rows[0])
     .catch(err => console.log(err.message));
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
  return pool
    .query(`
      INSERT INTO users (name, email, password)
      VALUES ($1, $2, $3)
      RETURNING *;
    `, [user.name, user.email, user.password])
    .then(res => res.rows[0])
    .catch(err => console.log(err.message));
};

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  return pool
    .query(`
      SELECT reservations.id AS reservation_id, title, start_date, cost_per_night, AVG(rating) AS average_rating, number_of_bedrooms, number_of_bathrooms, parking_spaces, thumbnail_photo_url
        FROM reservations
        JOIN properties ON properties.id = property_id
        JOIN reviews ON reservations.id = reservation_id
       WHERE reservations.guest_id = $1
      GROUP BY reservations.id, title, cost_per_night, number_of_bedrooms, number_of_bathrooms, parking_spaces, thumbnail_photo_url
      ORDER BY reservations.start_date
       LIMIT $2;
    `, [guest_id, limit])
    .then(res => res.rows)
    .catch(err => console.log(err.message));
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function (options, limit = 10) {
  const queryParams = [];
  let queryString = `
    SELECT properties.*, AVG(rating) as average_rating
      FROM properties
      JOIN reviews ON properties.id = property_id
  `;

  if (options.owner_id) {
    queryParams.push(`${options.owner_id}`);
    queryString += `WHERE owner_id = $${queryParams.length}`;
  }

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length}`;
  }
  
  if (options.minimum_price_per_night) {
    queryParams.push(`${options.minimum_price_per_night}`);
    queryString += (queryParams.length === 1)? `WHERE ` : ` AND `;
    queryString += `cost_per_night >= $${queryParams.length}`;
  }

  if (options.maximum_price_per_night) {
    queryParams.push(`${options.maximum_price_per_night}`);
    queryString += (queryParams.length === 1)? `WHERE ` : ` AND `;
    queryString += `cost_per_night <= $${queryParams.length}`;
  }
  
    queryString += `
      GROUP BY properties.id
    `;

  if (options.minimum_rating) {
    queryParams.push(`${options.minimum_rating}`);
    queryString += `HAVING AVG(rating) >= $${queryParams.length}`;
  }

  queryParams.push(limit);
    queryString += `
      ORDER BY cost_per_night
      LIMIT $${queryParams.length};
    `;

  console.log(queryString, queryParams);

  return pool
    .query(queryString, queryParams)
    .then(res => res.rows)
    .catch(err => console.log(err.message));
};

//  609 | Frederick Bryan | abigailcontreras@ymail.com | $2a$10$FB/BOAVhpuLvpOREQVmvmezD4ED/.JBIDRh70tGevYzYzQgFId2u.

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
};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
