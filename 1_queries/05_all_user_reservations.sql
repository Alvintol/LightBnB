SELECT reservations.id, 
properties.title, 
properties.cost_per_night, 
reservations.start_date, 
AVG(rating) AS average_rating
FROM properties
JOIN reservations ON properties.id=reservations.property_id
JOIN property_reviews ON properties.id=property_reviews.property_id
WHERE reservations.guest_id = '1'
GROUP BY properties.id, reservations.id
ORDER BY reservations.start_date
LIMIT 10;