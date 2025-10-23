// components/UnitSelect.jsx
import {
  Box,
  Text,
  Portal,
  Select,
  createListCollection,
} from "@chakra-ui/react";

export default function UnitSelect({
  label,
  name,
  collection,
  value,
  onChange,
  placeholder,
  defaultValue,
}) {
  return (
    <Box flex={1}>
      {label && (
        <Text fontWeight={"semibold"} mb={2}>
          {label}
        </Text>
      )}

      {defaultValue && (
        <Text fontSize="xs" color="gray.500" mt={1}>
          Default: {defaultValue}
        </Text>
      )}

      <Select.Root
        name={name}
        collection={collection}
        value={value ? [value] : []}
        onValueChange={(details) => onChange(details.value[0])}
      >
        <Select.HiddenSelect />
        <Select.Control>
          <Select.Trigger>
            <Select.ValueText placeholder={placeholder} />
          </Select.Trigger>
        </Select.Control>

        <Portal>
          <Select.Positioner>
            <Select.Content>
              {collection.items.map((item) => (
                <Select.Item item={item} key={item.value}>
                  {item.label}
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>
    </Box>
  );
}
