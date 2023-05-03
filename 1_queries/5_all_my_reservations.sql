SELECT reservations.id AS reservation_id, properties.title, reservations.start_date, properties.cost_per_night, AVG(rating) AS average_rating
  FROM reservations
  JOIN properties ON properties.id = property_id
  JOIN reviews ON reservations.id = reservation_id
 WHERE reservations.guest_id = 1
GROUP BY reservations.id, properties.title, reservations.start_date, properties.cost_per_night
ORDER BY reservations.start_date
 LIMIT 10;