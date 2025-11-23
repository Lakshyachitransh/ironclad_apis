import 'dotenv/config';

console.log('✅ Environment test running...');
console.log('Working directory:', process.cwd());
console.log('JWT_ACCESS_SECRET:', process.env.JWT_ACCESS_SECRET);
console.log('JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET);
