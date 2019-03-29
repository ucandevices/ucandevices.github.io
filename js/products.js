var app = angular.module('agmodule',[]);
app.controller("pagecontroller", ['$scope','$http', '$log', '$timeout', '$http', '$interval', function($scope, $http, $log, $timeout, $http, $interval) {
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
                    cost += parseInt($scope.products[i].quantity);
                }
            }
            return cost + 4;
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
        $scope.orderOK = false;

        $scope.ship = [];
        $scope.btcprice = 0;
        $scope.ship.paywith = 'Bitcoin';
        $scope.usdprice = 5


        $scope.updateBTCPrice = function(){
            $http.get('https://blockchain.info/tobtc?currency=USD&value='+$scope.usdprice).
                    then(function(response) {
                        $scope.btcprice = response.data;
                    });
        }

        $scope.askbtc = function() { 
            $scope.updateBTCPrice();               
            $interval(function() {
                $scope.updateBTCPrice();
            }, 60*1000);
        }

        $scope.sendMail = function()
        {
            emailjs.init("user_Q2ciBl3xynpYpMnHj4Ncd");
            var templateParams = {
                from_name: '',
                shipping_data: '',
                order_data: ''
            };

            templateParams.from_name = $scope.ship.firstName;
            templateParams.shipping_data = JSON.stringify(createShippingString());
            templateParams.order_data = JSON.stringify($scope.products);

            $scope.orderSend = true;

            emailjs.send('ucan', 'template_JXzr8VuM', templateParams)
                .then(function(response) {
                   console.log('SUCCESS!', response.status, response.text);
                   $scope.orderOK = true;
                   $scope.$apply();
                }, function(error) {
                   console.log('FAILED...', error);
                   $scope.orderErr = true;
                   $scope.orderInvalid = true;
                   $scope.$apply();
                });
        }

        function createShippingString()
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
