const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const databasePath = path.join(__dirname, "covid19India.db");
let db = null;
const initializeServerAndDatabase = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log(`Server is running on http://localhost:3000/`);
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeServerAndDatabase();

const convertStateTableDbToRequired = (list) => {
  return {
    stateId: list.state_id,
    stateName: list.state_name,
    population: list.population,
  };
};

const convertDistrictTableDbToRequired = (list) => {
  return {
    districtId: list.district_id,
    districtName: list.district_name,
    stateId: list.state_id,
    cases: list.cases,
    cured: list.cured,
    active: list.active,
    deaths: list.deaths,
  };
};

//API-1
app.get("/states/", async (request, response) => {
  const getStateDetailsQuery = `
    SELECT 
        *
    FROM 
        state;`;
  const stateNames = await db.all(getStateDetailsQuery);
  response.send(
    stateNames.map((eachObj) => convertStateTableDbToRequired(eachObj))
  );
});

//API-2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateDetailsQuery = `
    SELECT 
        *
    FROM 
        state
    WHERE 
        state_id = ${stateId};`;
  const stateDetail = await db.get(getStateDetailsQuery);
  response.send(convertStateTableDbToRequired(stateDetail));
});

//API-3
app.post("/districts/", async (request, response) => {
  const newDistrictDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = newDistrictDetails;
  const createDistrictDetails = `
    INSERT INTO 
        district(district_name,
                 state_id,
                 cases,
                 cured,
                 active,
                 deaths)
    VALUES('${districtName}',
            ${stateId},
            ${cases}, 
            ${cured},
            ${active}, 
            ${deaths});`;
  await db.run(createDistrictDetails);
  response.send("District Successfully Added");
});

//API-4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictDetailsQuery = `
    SELECT 
        *
    FROM 
        district
    WHERE 
        district_id = ${districtId};`;
  const districtDetail = await db.get(getDistrictDetailsQuery);
  response.send(convertDistrictTableDbToRequired(districtDetail));
});

//API-5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictDetailsQuery = `
    DELETE 
    FROM 
        district
    WHERE 
        district_id = ${districtId};`;
  await db.run(deleteDistrictDetailsQuery);
  response.send("District Removed");
});

//API-6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const newDistrictDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = newDistrictDetails;
  const updateDistrictDetails = `
    UPDATE 
        district
    SET 
        district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases}, 
        cured = ${cured},
        active = ${active}, 
        deaths = ${deaths};
    WHERE
        district_id = ${districtId}`;
  await db.run(updateDistrictDetails);
  response.send("District Details Updated");
});

//API-7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const reqStatusQuery = `
    SELECT 
        SUM(cases),
        SUM(cured),
        SUM(active),
        SUM(deaths)
    FROM 
        district
    WHERE state_id = ${stateId};`;
  const reqStatus = await db.get(reqStatusQuery);
  response.send({
    totalCases: reqStatus["SUM(cases)"],
    totalCured: reqStatus["SUM(cured)"],
    totalActive: reqStatus["SUM(active)"],
    totalDeaths: reqStatus["SUM(deaths)"],
  });
});

//API-8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
    SELECT 
        state_name 
    FROM 
        district NATURAL JOIN state 
    WHERE 
        district_id = ${districtId};`;
  const reqStateName = await db.get(getStateNameQuery);
  response.send({ stateName: reqStateName.state_name });
});

module.exports = app;
