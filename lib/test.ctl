/**
 * @brief Address structure
 * @details Auto-generated from JSON
 * @version 0.1
 * @date 2025-07-29
 */


 {
  "name": "Test User",
  "age": 30,
  "isActive": true,
  "address": {
    "street": "Main St",
    "city": "New York"
  }
}
struct Address
{
	/**
	 * @brief street
	 * @type {string}
	 */
	string	street;

	/**
	 * @brief city
	 * @type {string}
	 */
	string	city;

};

public Address AddressMapToObject(mapping data = makeMapping())
{
	Address address = new Address();
	// Processing street
	address.street = mappingHasKey(data, "street") ? data["street"] : "";
	// Processing city
	address.city = mappingHasKey(data, "city") ? data["city"] : "";
	return address;
}

public mapping AddressToMapping(Address address)
{
	mapping data;
	data["street"] = address.street;
	data["city"] = address.city;
	return data;
}
/**
 * @brief Test structure
 * @details Auto-generated from JSON
 * @version 0.1
 * @date 2025-07-29
 */
struct Test
{
	/**
	 * @brief name
	 * @type {string}
	 */
	string	name;

	/**
	 * @brief age
	 * @type {int}
	 */
	int	age;

	/**
	 * @brief is_active
	 * @type {bool}
	 */
	bool	is_active;

	/**
	 * @brief address
	 * @type {mapping}
	 */
	mapping	address;

};

public Test TestMapToObject(mapping data = makeMapping())
{
	Test test = new Test();
	// Processing name
	test.name = mappingHasKey(data, "name") ? data["name"] : "";
	// Processing age
	test.age = mappingHasKey(data, "age") ? data["age"] : 0;
	// Processing is_active
	test.is_active = mappingHasKey(data, "is_active") ? data["is_active"] : false;
	// Processing address
	if (mappingHasKey(data, "address")) {
		test.address = MappingMapToObject(data["address"]);
	} else {
		test.address = new Mapping();
	}
	return test;
}

public mapping TestToMapping(Test test)
{
	mapping data;
	data["name"] = test.name;
	data["age"] = test.age;
	data["is_active"] = test.is_active;
	data["address"] = MappingToMapping(test.address);
	return data;
}