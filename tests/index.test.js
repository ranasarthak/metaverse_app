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

describe.skip("Space information", () => {
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
        expect(deleteResponse.status).toBe(200);
    })

    test("User shouldnt b able to delete a space created by another user", async () => {
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
                authorization: `Bearer ${adminToken}`
            }
        })
        expect(deleteResponse.status).toBe(403);
    })

    test("Admin has no spaces initially", async () => {
        const response = await axios.get(`${BACKEND_URL}/space/all`, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        })
        expect(response.data.spaces.length).toBe(0);
    })

    test("Admin has one space after creation", async () => {
        const spaceCreationResponse = await axios.post(`${BACKEND_URL}/space`, {
            "name": "test",
            "dimensions": "300x400"
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        })
        
        expect(spaceCreationResponse.status).toBe(200);

        const response = await axios.get(`${BACKEND_URL}/space/all`, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        })

        expect(response.status).toBe(200);
        expect(response.data.spaces.length).toBe(1);
    })
})

describe.skip("Arena endpoints", () => {
    let userId;
    let userToken;
    let adminId;
    let adminToken;
    let element1Id;
    let element2Id;
    let mapId;
    let spaceId;

    beforeAll( async () => {
        const username = `rana-${Math.random()}`
        const password = "123456"
 
        const signUpResponse = await axios.post(`${BACKEND_URL}/signup`, {
         username,
         password,
         type: "admin"
        });

        adminId = signUpResponse.data.userId
 
        const response = await axios.post(`${BACKEND_URL}/signin`, {
         username: username,
         password
        })
 
        adminToken = response.data.token

        const userSignupResponse = await axios.post(`${BACKEND_URL}/signup`, {
            username: username + "-user",
            password,
            type: "user"
        });
   
        userId = userSignupResponse.data.userId
    
        const userSigninResponse = await axios.post(`${BACKEND_URL}/signin`, {
            username: username  + "-user",
            password
        })
        userToken = userSigninResponse.data.token

        const element1Response = await axios.post(`${BACKEND_URL}/admin/element`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            "width": 1,
            "height": 1,
          "static": true
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        });

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
        element1Id = element1Response.data.id
        element2Id = element2Response.data.id

        const mapResponse = await axios.post(`${BACKEND_URL}/admin/map`, {
            thumbnail: "https://thumbnail.com/a.png",
            dimensions: "100x200",
            name: "Default space",
            defaultElements: [{
                    elementId: element1Id,
                    x: 20,
                    y: 20
                }, {
                  elementId: element1Id,
                    x: 18,
                    y: 20
                }, {
                  elementId: element2Id,
                    x: 19,
                    y: 20
                }
            ]
         }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
         })
         mapId = mapResponse.data.mapId;

        const spaceResponse = await axios.post(`${BACKEND_URL}/space`, {
            "name": "Test",
            "dimensions": "100x200",
            "mapId": mapId
        }, {
            headers: {
                authorization: `Bearer ${userToken}`
            }
        })
        spaceId = spaceResponse.data.spaceId
    })

    test("Incorrect spaceId returns a 400", async () => {
        const response = await axios.get(`${BACKEND_URL}/space/123kasdk01`, {
            headers: {
                authorization: `Bearer ${userToken}`
            }
        });
        expect(response.status).toBe(400)
    })

    test("Correct spaceId returns all the elements", async () => {
        const response = await axios.get(`${BACKEND_URL}/space/${spaceId}`, {
            headers: {
                authorization: `Bearer ${userToken}`
            }
        });

        expect(response.data.dimensions).toBe("100x200")
        expect(response.data.elements.length).toBe(3)
    })

    test("Delete endpoint is able to delete an element present in space", async () => {
        const response = await axios.get(`${BACKEND_URL}/space/${spaceId}`, {
            headers: {
                authorization: `Bearer ${userToken}`
            }
        })

        const deleteResponse = await axios.delete(`${BACKEND_URL}/space/element`, {
            data: {
                id: response.data.elements[0].id
            },
            headers: {
                authorization: `Bearer ${userToken}`
            }
        })

        const finalResponse = await axios.get(`${BACKEND_URL}/space/${spaceId}`, {
            headers: {
                authorization: `Bearer ${userToken}`
            }
        })

        expect(finalResponse.data.elements.length).toBe(2);
    })

    test("Adding an element outside space fails", async () => {
        const response = await axios.post(`${BACKEND_URL}/space/element`, {
            elementId: element1Id,
            spaceId: spaceId,
            x: 30000,
            y: 490 
        }, {
            headers: {
                authorization: `Bearer ${userToken}`
            }
        })
        expect(response.status).toBe(400);
    })

    test("adding and element works as expected", async () => {
        let response = await axios.post(`${BACKEND_URL}/space/element`, {
            elementId: element1Id,
            spaceId: spaceId,
            x: 50,
            y: 40
        }, {
            headers: {
                authorization: `Bearer ${userToken}`
            }
        })

        expect(response.status).toBe(200);

        response = await axios.get(`${BACKEND_URL}/space/${spaceId}`, {
            headers: {
                authorization: `Bearer ${userToken}`
            }
        })

        expect(response.data.elements.length).toBe(3);
    })
})


describe("Admin endpoint", () => {
    let adminToken;
    let adminId;
    let userToken;
    let userId;

    beforeAll(async () => {
        const username = `rana-${Math.random()}`;
        const password = "123456";

        let signUpResponse = await axios.post(`${BACKEND_URL}/signup`, {
            username,
            password,
            type: "admin"
        });

        adminId = signUpResponse.data.userId;

        let signInResponse = await axios.post(`${BACKEND_URL}/signin`, {
            username,
            password
        })

        adminToken = signInResponse.data.token;

        signUpResponse = await axios.post(`${BACKEND_URL}/signup`, {
            username: "user" + username,
            password,
            type: "user"
        })

        userId = signUpResponse.data.userId;

        signInResponse = await axios.post(`${BACKEND_URL}/signin`, {
            username: "user" + username,
            password
        })

        userToken = signInResponse.data.token;
        console.log("usertoken: ", userToken);
    });

    test("User is not able to hit admin endpoints", async () => {
        let response = await axios.post(`${BACKEND_URL}/admin/element`, {
            imageUrl: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            width: 1,
            height: 1,
            static: true
        }, {
            headers: {
                authorization: `Bearer ${userToken}`
            }
        })
        expect(response.status).toBe(403);

        response = await axios.post(`${BACKEND_URL}/admin/map`, {
            "thumbnail": "https://thumbnail.com/a.png",
            "dimensions": "100x200",
            "name": "test space",
            "defaultElements": []
         }, {
            headers: {
                authorization: `Bearer ${userToken}`
            }
        })
        expect(response.status).toBe(403);

        response = await axios.post(`${BACKEND_URL}/admin/avatar`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
            "name": "Timmy"
        }, {
            headers: {
                "authorization": `Bearer ${userToken}`
            }
        })
        expect(response.status).toBe(403);

        response = await axios.put(`${BACKEND_URL}/admin/element/123`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
        }, {
            headers: {
                "authorization": `Bearer ${userToken}`
            }
        })
        expect(response.status).toBe(403);
    })

    test("Admin is able to hit admin Endpoints", async () => {
        const elementReponse = await axios.post(`${BACKEND_URL}/admin/element`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            "width": 1,
            "height": 1,
          "static": true
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        });

        const mapResponse = await axios.post(`${BACKEND_URL}/admin/map`, {
            "thumbnail": "https://thumbnail.com/a.png",
            "name": "Space",
            "dimensions": "100x200",
            "defaultElements": []
         }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        })

        const avatarResponse = await axios.post(`${BACKEND_URL}/admin/avatar`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
            "name": "Timmy"
        }, {
            headers: {
                "authorization": `Bearer ${adminToken}`
            }
        })
        expect(elementReponse.status).toBe(200)
        expect(mapResponse.status).toBe(200)
        expect(avatarResponse.status).toBe(200)
    })

    test("Admin is able to update the imageUrl for an element", async () => {
        const elementResponse = await axios.post(`${BACKEND_URL}/admin/element`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            "width": 1,
            "height": 1,
          "static": true
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        });

        const updateElementResponse = await axios.put(`${BACKEND_URL}/admin/element/${elementResponse.data.id}`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
        }, {
            headers: {
                "authorization": `Bearer ${adminToken}`
            }
        })

        expect(updateElementResponse.status).toBe(200);
    })
});

