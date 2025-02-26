<!-- This file is generated from the source code. Edit the files in /packages/hydrogen/src/components/SelectedVariantUnitPrice and run 'yarn generate-docs' at the root of this repo. -->

The `SelectedVariantUnitPrice` component renders a `UnitPrice` component for the product's selected variant's unit price.
It must be a descendent of a `ProductProvider`.

## Example code

```tsx
import {SelectedVariantUnitPrice, ProductProvider} from '@shopify/hydrogen';

export function ProductDetails({product}) {
  return (
    <ProductProvider value={product}>
      <SelectedVariantUnitPrice />
    </ProductProvider>
  );
}
```

## Alias

The `SelectedVariantUnitPrice` component is aliased by the `Product.SelectedVariant.UnitPrice` component. You can use whichever component you prefer.

## Component type

The `SelectedVariantUnitPrice` component is a client component, which means that it renders on the client. For more information about component types, refer to [React Server Components](/api/hydrogen/framework/react-server-components).

## Related components

- [`ProductProvider`](/api/hydrogen/components/product-variant/productprovider)
- [`UnitPrice`](/api/hydrogen/components/primitive/unitprice)

## Related hooks

- [`useProductOptions`](/api/hydrogen/hooks/product-variant/useproductoptions)
