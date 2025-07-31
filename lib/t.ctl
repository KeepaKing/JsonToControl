/**
 * @brief Address structure
 * @details Auto-generated from JSON
 * @version 0.1
 * @date 31-07-2025
 */
struct Address
{
	string	street;
	string	city;
};

public Address MappingToAddress(mapping data = makeMapping())
{
	Address address = new Address();
	address.street = mappingHasKey(data, "street") ? data["street"] : "";
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
 * @brief T structure
 * @details Auto-generated from JSON
 * @version 0.1
 * @date 31-07-2025
 */
struct T
{
	string	name;
	int	age;
	bool	is_active;
	mapping	address;
};

public T MappingToT(mapping data = makeMapping())
{
	T t = new T();
	t.name = mappingHasKey(data, "name") ? data["name"] : "";
	t.age = mappingHasKey(data, "age") ? data["age"] : 0;
	t.is_active = mappingHasKey(data, "is_active") ? data["is_active"] : false;
	if (mappingHasKey(data, "address")) {
		t.address = MappingToMapping(data["address"]);
	} else {
		t.address = makeMapping();
	}
	return t;
}

public mapping TToMapping(T t)
{
	mapping data;
	data["name"] = t.name;
	data["age"] = t.age;
	data["is_active"] = t.is_active;
	data["address"] = AddressToMapping(t.address);
	return data;
}