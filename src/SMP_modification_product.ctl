// License: NOLICENSE
//----------------------------------------------------------------------------------------
/**
 * @file SMP_modification_product.ctl
 * @brief
 * @version 0.1
 * @copyright Copyright (c) 2024
 * @author Al
 * @date 2024-06-22
 * @defgroup SMP
*/

///@{
//----------------------------------------------------------------------------------------
// Libraries used (#uses)
//----------------------------------------------------------------------------------------
#uses "Odil_common_functions"
//----------------------------------------------------------------------------------------
// Variables and Constants
//----------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------
/**
	@brief Структура счетчика по модификации для ссылки на данные внутри структуры
	@details Используется в панели Модификация
	@version 0.1
	@date 2024-09-02
*/
struct SMP_modification_counter
{
	int 	cycle; 			// цикл
	string 	dpe;			// дпе счетчика
	string	name;			// название
	string	description;	// полное описание
	string	fromObject;		// из какого объекта
	string	zone;			// из какого объекта
	//счетчик может содержаться либо в events, либо в properties/events
	// dpe это ссылка чтобы обновить данные по счетчику при редактировании
};

//-------------------------------------------------------------------------------------------
/**
	@brief Структура хранит данные счетчиков по модификациям
	@details Используется в панели Модификация
	@version 0.1
	@date 2024-09-02
*/
struct SMP_modification_product
{
	int 		number; // номер 
	string 		mnemo; 	// мнемо  
	string 		name;	// название
	dyn_string 	dpes;	// все дпе связки
	vector<SMP_modification_counter> counters;	// {dpe, cycle}
};


//-------------------------------------------------------------------------------------------
/**
	@brief Метод для преобразования маппинга данных в объект
	@param data данные для формирования объекта
	@version 0.1
	@date 2024-08-16
	@return SMP_modification_product объект использующийся в панели модификации
*/
public SMP_modification_product SMP_ModificationProductMapToObject(mapping data = makeMapping())
{
	SMP_modification_product obj = new SMP_modification_product();
	obj.number 	= mappingHasKey(data, "number") 	? data["number"] 	: 0;
	obj.mnemo	= mappingHasKey(data, "mnemo") 		? data["mnemo"]		: "";
	obj.name	= mappingHasKey(data, "name")		? data["name"] 		: "";

	dyn_mapping dmCounters = mappingHasKey(data, "counters")	? data["counters"] : makeDynMapping();
	vector<SMP_modification_counter> counters;
	for (int i = 1; i <= dynlen(dmCounters); i++)
		counters.append(SMP_ModificationCounterMapToObject(dmCounters[i]));
	obj.counters = counters;
	obj.dpes = SMP_ModificationProductCollectAllCountersDpes(counters);
	return obj;
}


//-------------------------------------------------------------------------------------------
/**
	@brief Метод для конвертации объекта
	@return mapping в соответсвтвии с названиями столбцов таблицы
*/
public mapping SMP_ModificationProductToMapping(SMP_modification_product obj)
{
	mapping data;
	data["number"] 		= obj.number;
	data["mnemo"] 		= obj.mnemo;
	data["name"] 		= obj.name;
	vector<SMP_modification_counter> tempCounters = obj.counters;
	dyn_mapping counters;
	for (int i = 0; i < tempCounters.count(); i++)
		dynAppendConst(counters, SMP_ModificationCounterToMapping(tempCounters.at(i)));
	data["counters"] 	= counters;
	return data;
}


//-------------------------------------------------------------------------------------------
/**
	@brief Метод для конвертации объекта
	@return mapping в соответсвтвии с названиями столбцов таблицы
*/
public mapping SMP_ModificationCounterToMapping(SMP_modification_counter obj)
{
	mapping data;
	data["dpe"] 		= obj.dpe;
	data["cycle"] 		= obj.cycle;
	data["name"] 		= obj.name;
	data["description"]	= obj.description;
	data["fromObject"]	= obj.fromObject;
	data["zone"]		= obj.zone;
	return data;
}


public SMP_modification_counter SMP_ModificationCounterMapToObject(mapping data = makeMapping())
{
	SMP_modification_counter obj = new SMP_modification_counter();
	obj.cycle 		= mappingHasKey(data, "cycle") 			? data["cycle"] 		: 0;
	obj.dpe			= mappingHasKey(data, "dpe") 			? data["dpe"]			: "";
	obj.name		= mappingHasKey(data, "name")			? data["name"] 			: "";
	obj.description	= mappingHasKey(data, "description") 	? data["description"]	: "";
	obj.fromObject	= mappingHasKey(data, "fromObject")		? data["fromObject"] 	: "";
	obj.zone		= mappingHasKey(data, "zone")			? data["zone"] 	: "";
	return obj;
}


public int SMP_ModificationProductGetUnusedNumber(vector<SMP_modification_product> modifications)
{
	dyn_int numbersList;
	for (int i = 0; i < modifications.count(); i++)
	{
		SMP_modification_product product = modifications.at(i);
		dynAppendConst(numbersList, product.number);
	}
	numbersList.sort();
	return Odil_getUnusedNumber(numbersList);
}


public dyn_string SMP_ModificationProductCollectAllCountersDpes(vector<SMP_modification_counter> counters)
{
	dyn_string allDpes;
	for (int i = 0; i < counters.count(); i++)
	{
		SMP_modification_counter counter = counters.at(i);
		dynAppendConst(allDpes, counter.dpe);
	}
	return allDpes;
}


public dyn_string SMP_ModificationCollectAllCountersDpes(vector<SMP_modification_product> products)
{
	dyn_string allDpes;
	for (int i = 0; i < products.count(); i++)
	{
		SMP_modification_product product = products.at(i);
		dynAppendConst(allDpes, SMP_ModificationProductCollectAllCountersDpes(product.counters));
	}
	return allDpes;
}

///@}