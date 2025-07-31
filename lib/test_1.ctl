/**
 * @brief Address structure
 * @details Auto-generated from JSON
 * @version 0.1
 * @date 2025-07-31
 */
struct Address
{
	string	street;	// 
	string	city;	// 
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
 * @brief Test1 structure
 * @details Auto-generated from JSON
 * @version 0.1
 * @date 2025-07-31
 */
struct Test1
{
	string	name;	// 
	int	age;	// 
	bool	is_active;	// 
	mapping	address;	// 
};

public Test1 Test1MapToObject(mapping data = makeMapping())
{
	Test1 test1 = new Test1();
	// Processing name
	test1.name = mappingHasKey(data, "name") ? data["name"] : "";
	// Processing age
	test1.age = mappingHasKey(data, "age") ? data["age"] : 0;
	// Processing is_active
	test1.is_active = mappingHasKey(data, "is_active") ? data["is_active"] : false;
	// Processing address
	if (mappingHasKey(data, "address")) {
		test1.address = MappingMapToObject(data["address"]);
	} else {
		test1.address = new Mapping();
	}
	return test1;
}

public mapping Test1ToMapping(Test1 test1)
{
	mapping data;
	data["name"] = test1.name;
	data["age"] = test1.age;
	data["is_active"] = test1.is_active;
	data["address"] = MappingToMapping(test1.address);
	return data;
}