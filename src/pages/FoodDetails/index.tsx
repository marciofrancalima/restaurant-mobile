import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import * as S from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const { navigate, setOptions } = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      const response = await api.get<Food>(`foods/${routeParams.id}`);
      const selectedFood = response.data;

      const extrasFood = selectedFood.extras.map((extra: Extra) => {
        return {
          ...extra,
          quantity: 0,
        };
      });

      setFood({
        ...selectedFood,
        formattedPrice: formatValue(selectedFood.price),
      });
      setExtras(extrasFood);
    }

    loadFood();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    const data = extras.map(extra => {
      const quantity = extra.id === id ? extra.quantity + 1 : extra.quantity;

      return {
        ...extra,
        quantity,
      };
    });

    setExtras(data);
  }

  function handleDecrementExtra(id: number): void {
    const data = extras.map(extra => {
      const quantity =
        extra.id === id && extra.quantity > 0
          ? extra.quantity - 1
          : extra.quantity;

      return {
        ...extra,
        quantity,
      };
    });

    setExtras(data);
  }

  function handleIncrementFood(): void {
    setFoodQuantity(state => state + 1);
  }

  function handleDecrementFood(): void {
    setFoodQuantity(state => {
      if (state > 1) {
        return state - 1;
      }

      return state;
    });
  }

  const toggleFavorite = useCallback(async () => {
    if (isFavorite) {
      setIsFavorite(false);
      await api.delete(`favorites/${food.id}`);
      return;
    }

    setIsFavorite(true);
    await api.post('favorites', food);
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    const priceExtra = extras.reduce(
      (sum, extra) => sum + extra.value * extra.quantity,
      0,
    );
    const totalPrice = (food.price + priceExtra) * foodQuantity;

    return formatValue(totalPrice);
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    const response = await api.get('orders');
    const orders = response.data;

    const newOrder = {
      ...food,
      id: orders.length + 1,
      extras: {
        ...extras,
      },
      quantity: foodQuantity,
    };

    // delete newOrder.id;

    try {
      await api.post('orders', newOrder);
      navigate('Orders');
    } catch (err) {
      console.log(err);
    }
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [favoriteIconName, setOptions, toggleFavorite]);

  return (
    <S.Container>
      <S.Header />

      <S.ScrollContainer>
        <S.FoodsContainer>
          <S.Food>
            <S.FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </S.FoodImageContainer>
            <S.FoodContent>
              <S.FoodTitle>{food.name}</S.FoodTitle>
              <S.FoodDescription>{food.description}</S.FoodDescription>
              <S.FoodPricing>{food.formattedPrice}</S.FoodPricing>
            </S.FoodContent>
          </S.Food>
        </S.FoodsContainer>
        <S.AdditionalsContainer>
          <S.Title>Adicionais</S.Title>
          {extras.map(extra => (
            <S.AdittionalItem key={extra.id}>
              <S.AdittionalItemText>{extra.name}</S.AdittionalItemText>
              <S.AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <S.AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </S.AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </S.AdittionalQuantity>
            </S.AdittionalItem>
          ))}
        </S.AdditionalsContainer>
        <S.TotalContainer>
          <S.Title>Total do pedido</S.Title>
          <S.PriceButtonContainer>
            <S.TotalPrice testID="cart-total">{cartTotal}</S.TotalPrice>
            <S.QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <S.AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </S.AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </S.QuantityContainer>
          </S.PriceButtonContainer>

          <S.FinishOrderButton onPress={() => handleFinishOrder()}>
            <S.ButtonText>Confirmar pedido</S.ButtonText>
            <S.IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </S.IconContainer>
          </S.FinishOrderButton>
        </S.TotalContainer>
      </S.ScrollContainer>
    </S.Container>
  );
};

export default FoodDetails;
