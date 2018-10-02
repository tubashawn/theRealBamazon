var mysql = require("mysql");
var inquirer = require("inquirer");
var connection = mysql.createConnection({
    port: 3307,
    user: "root",
    password: "root",
    database: "bamazon"
});

connection.connect(function (err) {
    if (err) throw err;
    // console.log("connected as id " + connection.threadId + "\n");
});

function productInfo() {
    connection.query("SELECT * FROM products",
        function (err, results) {
            if (err) throw err;

            inquirer.prompt([{
                type: "list",
                name: "promptChoice",
                message: "Which of the following would you like to buy?",
                choices: function () {
                    var choiceArray = [];
                    for (var i = 0; i < results.length; i++) {
                        choiceArray.push(results[i].product_name);
                    }
                    return choiceArray;
                }
            }]).then(function (answer) {
                var chosenItem = answer.promptChoice;
                inquirer.prompt([{
                    type: "confirm",
                    name: "confirmChoice",
                    message: "You chose " + chosenItem + ". Is that correct?",
                }]).then(function (confirm) {
                    if (!confirm.confirmChoice) {
                        console.log("Let's try this again.");
                        productInfo();
                    } else {
                        connection.query("SELECT * FROM products WHERE product_name =?", [
                            chosenItem
                        ], function (err, res) {
                            if (err) throw err;
                            if (res) {
                                // console.log(res[0]);
                                let chosenInfo = res[0];
                                figureQuantity(chosenInfo);
                            }
                        });
                    }
                });
                // console.log(answer);
            });
        });

        function figureQuantity(chosenInfo) {

            const availableQuantity = chosenInfo.stock_quantity;
            console.log("We have " + availableQuantity + " units available.");
            // connection.query(availableQuantity, function(err, res) {
            // 
            // });
            inquirer.prompt([{
                type: "input",
                name: "quantity",
                message: "What quantity would you like?"
            }]).then(function (quantity) {
                // availableQuantity based off database quantity
                var userQuantity = quantity.quantity;
                if (userQuantity > availableQuantity) {
                    console.log("Sorry, we only have " + availableQuantity + " in stock, please select a smaller quantity");
                    figureQuantity(chosenInfo);
                } else {                    
                    console.log("The total cost for your " + chosenInfo.product_name + " is $" + chosenInfo.price * userQuantity);  
                    connection.query("UPDATE products SET stock_quantity = stock_quantity - ? " + 
                    "WHERE product_name = ?", 
                    [userQuantity, chosenInfo.product_name], function (err, results, fields) {
                        if (err) throw err;
                });
            }
        }).then(function() {
            inquirer.prompt([{
                type: "confirm",
                name: "confirmChoice",
                message: "Would you like to purchase anything else?"
            }]).then(function(confirm) {
                if (!confirm.confirmChoice) {
                    console.log("Thanks for shopping @ Bamazon, have a great day!");
                    return;
                } else {
                    productInfo();
                }
            });
        });
    }
}
// });
// }



productInfo();