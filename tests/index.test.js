const axios2 = require("axios");

const BACKEND_URL = "http://localhost:3000/api/v1"
const WS_URL = "ws://localhost:3001"

const axios = {
    post: async(...args) => {
        try {
            const res = await axios2.post(...args)
            return res
        }
        catch(e) {
            return e.response
        }
    },
    get: async(...args) => {
        try {
            const res = await axios2.get(...args)
            return res
        }
        catch(e) {
            return e.response
        }
    },
    put: async(...args) => {
        try {
            const res = await axios2.put(...args)
            return res
        }
        catch(e) {
            return e.response
        }
    },
    delete: async(...args) => {
        try {
            const res = await axios2.delete(...args)
            return res
        }
        catch(e) {
            return e.response
        }
    }
}


describe.skip("Authentication", () => {
    test('User is able to signup only once', async () => {
        const username = "sara" + Math.random();
        const password = "12788834554";
        const response = await axios.post(`${BACKEND_URL}/signup`, {
            username,
            password,
            type: "admin"
        })
        expect(response.status).toBe(200);
        const updatedResponse = await axios.post(`${BACKEND_URL}/signup`, {
            username,
            password,
            type: "admin"
        })
        expect(updatedResponse.status).toBe(400);
    });

    test('Signup fails if username/password is emppty', async () => {
        const username = `rana - ${ Math.random() }`;
        const password = "1278883485438";
        const response = await axios.post(`${BACKEND_URL}/signup`, {
            password
        })

        expect(response.status).toBe(400);
        const updatedResponse = await axios.post(`${BACKEND_URL}/signup`, {
            username
        })

        expect(response.status).toBe(400);
    })

    test('Successful signin and token generation post signup', async () => {
        const username = `rana - ${ Math.random() }`;
        const password = "13788844983";
        await axios.post(`${BACKEND_URL}/signup`, {
            username,
            password,
            type: "admin"
        })

        const response = await axios.post(`${BACKEND_URL}/signin`, {
            username,
            password
        })
        console.log("L: ", response.data);
        expect(response.status).toBe(200);
        expect(response.data.token).toBeDefined();
    })

    test ('Sigin fails with wrong username/password', async () => {
        const username = `rana - ${Math.random()}`;
        const password = '3278884893123';
        await axios.post(`${BACKEND_URL}/signup`, {
            username,
            password,
            type: 'admin'
        })

        const response = await axios.post(`${BACKEND_URL}/signin`, {
            username: "WrongUsername",
            password
        })

        expect(response.status).toBe(403);
        const secondResponse = await axios.post(`${BACKEND_URL}/signin`, {
            username,
            password: "WrongPassword"
        })

        expect(secondResponse.status).toBe(403);
    })
})


describe.skip("User metadata endpoint", () => {
    let token = "";
    let avatarId = "";

    beforeAll(async () => {
        const username = `rana-${ Math.random() }`;
        const password = '2378884343434';

        await axios.post(`${BACKEND_URL}/signup`, {
            username,
            password,
            type: 'admin'
        })

        const response = await axios.post(`${BACKEND_URL}/signin`, {
            username,
            password
        })

        token = response.data.token;

        const avatarResponse = await axios.post(`${BACKEND_URL}/admin/avatar`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
            "name": "Timmy"
        }, {
            headers: {
                "authorization": `Bearer ${ token }`
            }
        })
        avatarId = avatarResponse.data.avatarId;
    })

    test('Users should b able to update their metadata with only the right avatarId and token', async () => {
        const response = await axios.post(`${BACKEND_URL}/user/metadata`, {
            avatarId: '343434'
        }, {
            headers : {
                "authorization": `Bearer ${ token }`
            }
        })

        expect(response.status).toBe(400);

        const newResponse = await axios.post(`${BACKEND_URL}/user/metadata`, {
            avatarId
        }, {
            headers : {
                "authorization": `Bearer ${ token }`
            }
        })

        expect(newResponse.status).toBe(200);

        const anotherResponse = await axios.post(`${BACKEND_URL}/user/metadata`, {
            avatarId
        })

        expect(anotherResponse.status).toBe(401);
    }) 
})

describe.skip("User avatar information", () => {
    let avatarId;
    let token;
    let userId;

    beforeAll(async () => {
        const username = `rana-${ Math.random() }`;
        const password = '234343434';

        const signUpResponse = await axios.post(`${BACKEND_URL}/signup`, {
            username,
            password,
            type: 'admin'
        })

        userId = signUpResponse.data.userId;

        const signInResponse = await axios.post(`${BACKEND_URL}/signin`, {
            username,
            password
        })

        token = signInResponse.data.token;

        const avatarResponse = await axios.post(`${BACKEND_URL}/admin/avatar`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
            "name": "Timmy"
        }, {
            headers: {
                "authorization": `Bearer ${ token }`
            }
        })
        
        avatarId = avatarResponse.data.avatarId;
    })

    test('Get back avatar info for a user', async () => {
        console.log(userId);
        const response = await axios.get(`${BACKEND_URL}/user/metadata/bulk?ids=[${ userId }]`,{
            headers: {
                "authorization": `Bearer ${ token }`
            }
        });
        console.log(response.data);
        expect(response.data.avatars.length).toBe(1);
        expect(response.data.avatars[0].userId).toBe(userId);
    })

    test('get/avatars endpoint should return the recently created avatars', async () => {
        const response = await axios.get(`${BACKEND_URL}/avatars`, {
            headers: {
                "authorization": `Bearer ${ token }`
            }
        });
        expect(response.data.avatars.length).not.toBe(0);
        const currentAvatar = response.data.avatars.find(x => x.id == avatarId);
        expect(currentAvatar).toBeDefined();
    })
})

describe('Space information', () => {
    let mapId;
    let element1Id;
    let element2Id;
    let adminToken;
    let adminId;
    let userToken;
    let userId;

    beforeAll(async () => {
        const username = `rana-${ Math.random() }`;
        const password = '234343434';

        const adminSignUpResponse = await axios.post(`${BACKEND_URL}/signup`, {
            username,
            password,
            type: 'admin'
        })

        adminId = adminSignUpResponse.data.userId;

        const adminSignInResponse = await axios.post(`${BACKEND_URL}/signin`, {
            username,
            password
        })

        adminToken = adminSignInResponse.data.token;

        const userSignUpResponse = await axios.post(`${BACKEND_URL}/signup`, {
            username:'user' + username,
            password,
            type: 'user'
        })

        userId = userSignUpResponse.data.userId;

        const UserSignInResponse = await axios.post(`${BACKEND_URL}/signin`, {
            username: 'user' + username,
            password
        })

        userToken = UserSignInResponse.data.token;

        const element1Response = await axios.post(`${BACKEND_URL}/admin/element`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            "width": 1,
            "height": 1,
            "static": true
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        })

        const element2Response = await axios.post(`${BACKEND_URL}/admin/element`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            "width": 1,
            "height": 1,
            "static": true
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        })
        element1Id = element1Response.data.id;
        element2Id = element2Response.data.id;
        
        const mapResponse = await axios.post(`${BACKEND_URL}/admin/map`, {
            "thumbnail": "https://thumbnail.com/a.png",
            "dimensions": "100x200",
            "name": "Test space",
            "defaultElements": [{
                elementId: element1Id,
                x: 20,
                y: 20
            },{
                elementId: element1Id,
                x: 10,
                y: 20
            },{
                elementId: element2Id,
                x: 15,
                y: 20
            }]
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        })

        mapId = mapResponse.data.id;
    })

    test("User is able to create a space", async() => {
      const response = await axios.post(`${BACKEND_URL}/space`, {
        "name": "Test",
        "dimensions": "200x300",
        "mapId": mapId
      }, {
        headers: {
            authorization: `Bearer ${userToken}`
        }
      });
      expect(response.status).toBe(200);
      expect(response.data.spaceId).toBeDefined();
    })

    test("User is able to create a space without mapId (empty space)", async() => {
        const response = await axios.post(`${BACKEND_URL}/space`, {
          "name": "Test",
          "dimensions": "200x300"
        }, {
          headers: {
              authorization: `Bearer ${userToken}`
          }
        });
        expect(response.status).toBe(200);
        expect(response.data.spaceId).toBeDefined();
    })

    test("User is not able to create a space wihtout a mapId and dimensions", async() => {
        const response = await axios.post(`${BACKEND_URL}/space`, {
          "name": "Test"
        }, {
          headers: {
              authorization: `Bearer ${userToken}`
          }
        });
        expect(response.status).toBe(400);
    })

    test("User shouldnt be able to delete a space which doesnt exist", async () => {
        const response = await axios.delete(`${BACKEND_URL}/space/randomSpaceId`, {
            headers: {
                authorization: `Bearer ${userToken}`
            }
        });
        expect(response.status).toBe(400);
    })

    test("User is able to delete a space that does exist", async () => {
        console.log("this is userToken", userToken);
        const response = await axios.post(`${BACKEND_URL}/space`, {
            "name": "test",
            "dimensions": "200x300"
        }, {
            headers: {
                authorization: `Bearer ${userToken}`
            }
        })

        const deleteResponse = await axios.delete(`${BACKEND_URL}/space/${response.data.spaceId}`, {
            headers: {
                authorization: `Bearer ${userToken}`
            }
        })
        console.log(deleteResponse);
        expect(deleteResponse.status).toBe(200);
    })
})

