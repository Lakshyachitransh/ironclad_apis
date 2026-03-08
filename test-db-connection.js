// Test PostgreSQL connection
const { Client } = require('pg');

const connectionString = 'postgresql://postgres:1103$fug@3.7.64.213:5432/ironclad';

console.log('Testing database connection...');
console.log('Connection string:', connectionString);
console.log('');

const client = new Client({
  connectionString: connectionString,
  ssl: false,
  connect_timeout: 10,
});

client.connect((err) => {
  if (err) {
    console.error('❌ Connection failed:');
    console.error('Error:', err.message);
    console.error('Code:', err.code);
    process.exit(1);
  } else {
    console.log('✅ Connection successful!');
    
    client.query('SELECT version();', (err, res) => {
      if (err) {
        console.error('Error executing query:', err);
      } else {
        console.log('PostgreSQL Version:', res.rows[0].version);
      }
      
      client.query('SELECT current_user;', (err, res) => {
        if (err) {
          console.error('Error:', err);
        } else {
          console.log('Current User:', res.rows[0].current_user);
        }
        
        client.end();
        process.exit(0);
      });
    });
  }
});
