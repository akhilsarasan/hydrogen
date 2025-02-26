<!-- This file is generated from the source code. Edit the files in /packages/hydrogen/src/hooks/useParsedMetafields and run 'yarn generate-docs' at the root of this repo. -->

The `useParsedMetafields` hook transforms a [MetafieldConnection](/api/storefront/reference/common-objects/metafieldconnection)
in an array of metafields whose `values` have been parsed according to the metafield `type`.

## Example code

```tsx
import {useParsedMetafields, Metafield} from '@shopify/hydrogen';

export function Product(product) {
  const metafields = useParsedMetafields(product.metafields);

  return (
    <ul>
      {metafields.map((field) => {
        return (
          <li>
            <Metafield metafield={field} />
          </li>
        );
      })}
    </ul>
  );
}
```

## Return type

This hook returns an array of metafields whose `values` have been parsed according to the metafield `type`. For details on the parsed value, refer to the [`parseMetafieldValue`](/api/hydrogen/utilities/parsemetafieldvalue) utility.

## Related utilities

- [`parseMetafieldValue`](/api/hydrogen/utilities/parsemetafieldvalue)
