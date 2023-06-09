const Lib = require('./lib');

const DB = function (schema, cityDataBuffer) {

	let cityData = {};
	let cityDataIndex = 0;
	let alterNames = {};
	let promise = Lib.Deferred();

	const recordSize = schema.reduce((a, f) => a + f.length, 0);
	const recordsCount = cityDataBuffer.length / recordSize;

	const instance = {
		lookup: (cityName) => {
			if (!cityName) return [];
			const ids = (alterNames[cityName.toLowerCase().trim()] || '').split(',').filter(a => a);
			const data = ids?.map(id => {
				// if (cityData[id] === undefined) return;
				return instance.getById(id);
			}).filter(d => d);
			return data;
		},

		getById: id => {
			if (cityData[id]?.constructor == Object)
			{
				return cityData[id];
			}

			const offset = cityData[id] * recordSize;
			const data = Lib.createObjectFromBuffer(schema, cityDataBuffer.slice(offset, offset + recordSize));
			data.id = id;
			return data;
		},

		add: (names, id, data) => {
			const isNew = cityData[id] === undefined;

			if (cityDataIndex < recordsCount)
			{
				cityData[id] = cityDataIndex;
			}
			else
			{
				// Add extra data (patches)
				cityData[id] = cityData[id] ?? data;
			}

			for (let i = 0; i < names.length; i++)
			{
				if (alterNames[names[i]])
				{
					const ids = alterNames[names[i]];

					if (!ids.match(new RegExp(`\\b${id}\\b`)))
					{
						alterNames[names[i]] += ',' + id;

					}
				}
				else
				{
					alterNames[names[i]] = '' + id;
				}
			}

			if (isNew)
			{
				cityDataIndex++;
			}
		},

		wait: function () {
			return promise;
		},

		end: function () {
			promise.fulfill();
		},
	}

	return instance;
}

module.exports = DB;
