const express = require('express');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors());

const customers = [];

function verifyIfExistAccountCPF(request, response, next) {
	const { cpf } = request.headers;

	const customer = customers.find(cust => cust.cpf === cpf);

	if (!customer) {
		return response.status(400).json({ error: 'Customer not found' });
	}

	request.customer = customer;

	return next();
}

function getBalance(statement) {
	const balance = statement.reduce((acc, operation) => {
		if (operation.type === 'credit') {
			return acc + operation.amount;
		}

		if (operation.type === 'debit') {
			return acc - operation.amount;
		}
	}, 0);

	return balance;
}

app.post('/account', (request, response) => {
	const { cpf, name } = request.body;
	const customerAlreadyEnxist = customers.some(
		customer => customer.cpf === cpf,
	);
	if (customerAlreadyEnxist) {
		return response.status(400).json({ error: 'Customer already exist!' });
	}

	customers.push({
		cpf,
		name,
		id: uuidv4(),
		statement: [],
	});

	return response.status(201).send();
});

app.get('/statement', verifyIfExistAccountCPF, (request, response) => {
	const { customer } = request;
	return response.json(customer.statement);
});

app.post('/deposit', verifyIfExistAccountCPF, (request, response) => {
	const { description, amount } = request.body;
	const { customer } = request;
	const statementOperation = {
		description,
		amount,
		createdAt: new Date(),
		type: 'credit',
	};

	customer.statement.push(statementOperation);

	return response.status(201).send(statementOperation);
});

app.post('/withdraw', verifyIfExistAccountCPF, (request, response) => {
	const { amount } = request.body;
	const { customer } = request;

	const balance = getBalance(customer.statement);

	if (balance < amount) {
		return response.status(400).json({ error: 'Insufficient funds' });
	}

	const statementOperation = {
		amount,
		createdAt: new Date(),
		type: 'debit',
	};

	customer.statement.push(statementOperation);

	return response.status(201).json({ message: 'The operation have sucessfull'});
});

app.get('/statement/date', verifyIfExistAccountCPF, (request, response) => {
	const { customer } = request;

	const { date } = request.query;

	const dateFormat = new Date(date + " 00:00");

	const statement = customer.statement.filter(
		(statement) =>
			statement.createdAt.toDateString() === new Date(dateFormat).toDateString()
	)
	console.log(statement)
	return response.status(201).json(statement);
});

app.put('/account', verifyIfExistAccountCPF, (request, response) => {
	const { name } = request.body;
	const { customer } = request;

	customer.name = name;

	return response.status(201).send();
});

app.get('/account', verifyIfExistAccountCPF, (request, response) => {
	const { customer } = request;

	return response.json(customer);
})

app.delete('/account', verifyIfExistAccountCPF, (request, response) => {
	const { customer } = request;

	customers.splice(customers.indexOf(customer), 1)
	console.log(customers)
	return response.status(200).json(customers);
})
const PORT = 3333;
app.listen(PORT, () => {
	console.log('Server is running at http://localhost:' + PORT);
});
