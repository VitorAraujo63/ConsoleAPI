https://www.jadlog.com.br/embarcador/api/frete/valor
{
    "frete": [
        {
            "cepori": "86055620",**
            "cepdes": "69098432",**
            "frap": "N",
            "peso": 0.150,**
            "cnpj": "19700881000181",**
            "conta": null,
            "contrato": null,
            "modalidade": 9,**
            "tpentrega": "D",
            "tpseguro": "N",
            "vldeclarado": 139.00,**
            "vlcoleta": null
        }
    ]
}

Return: 
{
    "frete": [
        {
            "cepori": "86055620",
            "cepdes": "69098432",
            "peso": 0.15,
            "modalidade": 9,
            "vldeclarado": 139.0,
            "frap": "N",
            "cnpj": "19700881000181",
            "tpentrega": "D",
            "tpseguro": "N",
            "vltotal": 83.34,
            "prazo": 14
        }
    ]
}

https://api.correios.com.br/token/v1/autentica/cartaopostagem

Basic Auth
    Username**
    Password**

Body
{
    "numero": "0076050149"**
}

Return: 
{
    "ambiente": "PRODUCAO",
    "id": "casachina2020.",
    "ip": "138.122.174.2, 192.168.1.131",
    "perfil": "PJ",
    "cnpj": "02897801000470",
    "categoria": "Bz0",
    "emissao": "2026-07-01T11:50:58",
    "expiraEm": "2026-07-02T11:50:58",
    "zoneOffset": "-03:00",
    "cartaoPostagem": {
        "contrato": "9912515475",
        "numero": "0076050149",
        "dr": 36,
        "api": [
            34,
            35,
            36,
            41,
            76,
            78,
            80,
            83,
            87,
            566,
            586,
            587
        ],
        "apis": [
            {
                "api": 34
            },
            {
                "api": 35
            },
            {
                "api": 36
            },
            {
                "api": 41
            },
            {
                "api": 76
            },
            {
                "api": 78
            },
            {
                "api": 80
            },
            {
                "api": 83
            },
            {
                "api": 87,
                "grupos": [
                    {
                        "co": "2",
                        "urls": [
                            "*;.*"
                        ]
                    }
                ]
            },
            {
                "api": 566
            },
            {
                "api": 586
            },
            {
                "api": 587
            }
        ]
    },
    "token": "eyJhbGciOiJSUzI1NiJ9.eyJpYXQiOjE3ODI5MTc0NTgsImlzcyI6InRva2VuLXNlcnZpY2UiLCJleHAiOjE3ODMwMDM4NTgsImp0aSI6IjU3NzAwMWRlLWZkNmMtNDQzYi1iNTMwLTM3ZTBkNGIxYjY0MiIsImFtYmllbnRlIjoiUFJPRFVDQU8iLCJwZmwiOiJQSiIsImlwIjoiMTM4LjEyMi4xNzQuMiwgMTkyLjE2OC4xLjEzMSIsImNhdCI6IkJ6MCIsImNhcnRhby1wb3N0YWdlbSI6eyJjb250cmF0byI6Ijk5MTI1MTU0NzUiLCJudW1lcm8iOiIwMDc2MDUwMTQ5IiwiZHIiOjM2LCJhcGlzIjpbeyJhcGkiOjM0fSx7ImFwaSI6MzV9LHsiYXBpIjozNn0seyJhcGkiOjQxfSx7ImFwaSI6NzZ9LHsiYXBpIjo3OH0seyJhcGkiOjgwfSx7ImFwaSI6ODN9LHsiYXBpIjo4NywiZ3J1cG9zIjpbeyJjbyI6IjIiLCJ1cmxzIjpbIio7LioiXX1dfSx7ImFwaSI6NTY2fSx7ImFwaSI6NTg2fSx7ImFwaSI6NTg3fV19LCJpZCI6ImNhc2FjaGluYTIwMjAuIiwiY25waiI6IjAyODk3ODAxMDAwNDcwIn0.Tyr53fKLezBz0Si5MixZNd5cIQbDYqJPvrcEu088-JqK2T27QJD8quKJsJLA7yNKosnwCRTfoVsre0vbOoCI_s3t2d08s2iCR10_kdlQ1GdD9qx9OeEM7WqRKMYbp8JwiBCC4CXOfEIZY9G1c2iGg7rKO3XVhtpaxGquAS9srREt04Me3q0p7TejqLDtlheQnnIITQSOLuEz0HfTnc2cdQNFZRn6myDcn7K0OwYClhYqjw51zQKifVEUipTJ9K-6AwF_4bXthqkgdaT-P1_7QtE8XzdhLgBs6p1Bj97F6pTCqN_BSpUuX-KOjAqML4N3p9t8Ix5gcDxuA37gY4IiZg"
}


(para consultar o preço do frete será preciso pegar as informações da API de cima e jogar para essa de baixo, os dados que precisa replicar para a api de baixo são DR -> nuDR, Contrato -> nuContrato, token -> Token, a ideia é consultar na de cima primeiro e já jogar para a proxima página ou na mesma página mostrar os demais campos para ser preenchido, dessa forma será consultado diretamente o preço do frete)
https://api.correios.com.br/preco/v1/nacional/03298?cepOrigem=82600000&cepDestino=09185670&psObjeto=19600&largura=40&altura=40&comprimento=40&tpObjeto=1&nuContrato=9912515475&nuDR=36
Bearer Token
    Token**

Params:
    vlDeclarado
    servicosAdicionais
    servicosAdicionais
    cepOrigem**
    cepDestino**
    psObjeto**
    largura**
    altura**
    comprimento**
    tpObjeto**(default = 1)
    nuContrato**
    nuDR**

Return:
{
    "coProduto": "03298",
    "pcBase": "15,45",
    "pcBaseGeral": "106,25",
    "peVariacao": "0,0000",
    "pcReferencia": "106,25",
    "vlBaseCalculoImposto": "106,25",
    "inPesoCubico": "N",
    "psCobrado": "19600",
    "peAdValorem": "0,0100",
    "vlSeguroAutomatico": "25,63",
    "qtAdicional": "10",
    "pcFaixa": "47,45",
    "pcCadaAdicional": "5,88",
    "pcTotalAdicional": "58,80",
    "pcFaixaVariacao": "47,45",
    "pcCadaAdicionalVariacao": "5,88",
    "pcTotalAdicionalVariacao": "58,80",
    "pcProduto": "106,25",
    "pcFinal": "106,25"
}


(para o mercado livre, todas as consultas precisa do "Access Token", isso a pessoa irá pegar por fora, apenas coloque o campo para ser preenchido)

https://api.mercadolibre.com/orders/(order_id)
Bearer token
    Token** (access token)

https://api.mercadolibre.com/shipments/(shipment_id)
Bearer token
    Token** (access token)

https://api.mercadolibre.com/catalog_quality/status?item_id=(MLB_ID)
Bearer token
    Token** (access token)

Params:
    item_id**

