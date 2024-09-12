const { Pool } = require('pg');

function connectToDatabase() {
  const pool = new Pool({
    user: 'qprofiles_admin',
    host: '3.110.221.47',
    database: 'pvm_qprofile_dev',
    password: 'YQpAbU87Cjpr2A8p77A1qDYF9GI',
    port: 8800, // default PostgreSQL port
    // user: 'webrtcread',
    // host: '3.110.221.47',
    // database: 'webrtc',
    // password: 'webrtcread@1234',
    // port: 8800, // default PostgreSQL port
  });

  return pool;
}

// Function to execute a query using the provided pool
async function executeQuery(pool, query,params) {
    try {
      const client = await pool.connect();
      const result = await client.query(query,params);
      client.release();
      return result.rows;
    } catch (error) {
      console.error('Error executing query:', error);
      throw error;
    }
    finally{
        if(pool){
            pool.end();
        }
        
    }
  }
  
  module.exports = {
    connectToDatabase,
    executeQuery,
  };