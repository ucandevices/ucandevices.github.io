var app = angular.module('agmodule',[]);
app.controller("pagecontroller", ['$scope','$http', '$log', '$timeout', '$http', function($scope, $http, $log, $timeout, $http) {
      $http.get('products.json')
       .then(function(res){
          $scope.products = res.data;

        });

        $scope.shipment = function()
        {
            var cost = 0;
            var i;

            if (typeof ($scope.products) != 'undefined')
            {
                for (i =0; i < $scope.products.length; i++)
                {
                  if (($scope.products[i].canbuy == true) && (!isNaN(parseInt($scope.products[i].quantity))))
                    cost += $scope.products[i].quantity;
                }
            }
            return Math.round(cost/3) + 4;
        }

        $scope.totalCost = function()
        {
            var cost = 0;
            var i;

            if (typeof ($scope.products) != 'undefined')
            {
                for (i =0; i < $scope.products.length; i++)
                {
                  if (($scope.products[i].canbuy == true) && (!isNaN(parseInt($scope.products[i].quantity))))
                    cost += $scope.products[i].quantity * $scope.products[i].cost;
                }
            }
            cost += $scope.shipment();
            return cost;
        }

        $scope.orderInvalid = false;
        $scope.orderSend = false;
        $scope.orderErr = false;

        $scope.ship = [];
        $scope.ship.paywith = 'Bitcoin';
        $scope.sendMail = function()
        {
            if (($scope.buyForm.firstName.$valid * $scope.buyForm.streetName.$valid * $scope.buyForm.zipCode.$valid * $scope.buyForm.town.$valid * $scope.buyForm.country.$valid *  $scope.buyForm.mail.$valid * $scope.buyForm.paywith.$valid) == 1)
            {
                var postData = createMail();
                var httpReq = $http.post("place_order.php",postData)
                .then(function (response) {
                    console.log("OK");
                    $scope.orderInvalid = false;
                    $scope.orderSend = true;
                })
                .catch(function (response) {
                    console.log("ERr");
                    $scope.orderErr = true;
                })
                .finally(function() {
                    // console.log("finally finished gists");
                    // $scope.orderSend = true;
                });
            }
           else {
                $scope.orderInvalid = true;
            }
        }

        function createMail()
        {
            var FormData = {
              'firstName' : $scope.ship.firstName,
              'lastName' : $scope.ship.lastName,
              'streetName' : $scope.ship.streetName,
              'flatNumber' : $scope.ship.flatNumber,
              'town' : $scope.ship.town,
              'zipCode' : $scope.ship.zipCode,
              'additionalInfo' : $scope.ship.additionalInfo,
              'country' : $scope.ship.country,
              'paywith' : $scope.ship.paywith,
              'mailTo' : $scope.ship.mail
            };
            return FormData;
        }
}]);
