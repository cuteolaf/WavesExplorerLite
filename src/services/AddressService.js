import groupBy from 'lodash/groupBy';

import {api} from '../shared/NodeApi';
import Alias from '../shared/Alias';
import Currency from '../shared/Currency';
import Money from '../shared/Money';

export class AddressService {
    constructor(transactionTransformerService, currencyService) {
        this.transformer = transactionTransformerService;
        this.currencyService = currencyService;
    }

    loadBalance = (address) => {
        return api.addresses.details(address).then(balanceResponse => {
            const data = balanceResponse.data;
            return {
                regular: Money.fromCoins(data.regular, Currency.WAVES).toString(),
                generating: Money.fromCoins(data.generating, Currency.WAVES).toString(),
                available: Money.fromCoins(data.available, Currency.WAVES).toString(),
                effective: Money.fromCoins(data.effective, Currency.WAVES).toString()
            };
        });
    };

    loadTransactions = (address) => {
        return api.transactions.address(address).then(transactionsResponse => {
            return this.transformer.transform(transactionsResponse.data[0]);
        });
    };

    loadAliases = (address) => {
        return api.addresses.aliases(address).then(aliasesResponse => {
            const lines = aliasesResponse.data.map(item => Alias.fromString(item).alias);
            const grouped = groupBy(lines, item => item.toUpperCase().charAt(0));
            return Object.keys(grouped).sort().map(letter => ({
                letter,
                aliases: grouped[letter].sort()
            }));
        });
    };

    loadAssets = (address) => {
        return api.addresses.assetsBalance(address).then(balanceResponse => {
            const assets = balanceResponse.data.balances.map(item => {
                const currency = Currency.fromIssueTransaction(item.issueTransaction);
                this.currencyService.put(currency);

                const amount = Money.fromCoins(item.balance, currency);

                return {
                    id: item.assetId,
                    name: currency.toString(),
                    amount: amount.formatAmount()
                };
            });

            return assets;
        });
    }
}
