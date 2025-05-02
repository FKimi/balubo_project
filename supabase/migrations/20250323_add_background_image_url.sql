/*
  # Add background_image_url to users table
  
  This migration adds a background_image_url column to the users table
  to allow users to set a background image for their profile page.
*/

-- Add background_image_url column to users table
ALTER TABLE users ADD COLUMN background_image_url text;
