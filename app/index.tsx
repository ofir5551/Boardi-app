import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { useSoundboardStore } from "@/src/store/soundboardStore";
import { MAX_BOARDS } from "@/src/constants/limits";
import type { Soundboard } from "@/src/types/soundboard";

export default function HomeScreen() {
  const router = useRouter();
  const { boards, isLoading, loadBoards, createBoard, deleteBoard } =
    useSoundboardStore();
  const [showInput, setShowInput] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  const handleCreate = async () => {
    if (boards.length >= MAX_BOARDS) {
      Alert.alert("Limit reached", `You can have up to ${MAX_BOARDS} soundboards.`);
      return;
    }
    if (!showInput) {
      setShowInput(true);
      return;
    }
    const name = newName.trim() || `Board ${boards.length + 1}`;
    await createBoard(name);
    setNewName("");
    setShowInput(false);
  };

  const handleDelete = (board: Soundboard) => {
    Alert.alert("Delete Board", `Delete "${board.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteBoard(board.id),
      },
    ]);
  };

  const handleOpen = (board: Soundboard) => {
    router.push(`/soundboard/${board.id}`);
  };

  return (
    <View className="flex-1 bg-gray-100 px-4 pt-4">
      <Text className="text-gray-900 text-2xl font-bold mb-4">
        My Soundboards
      </Text>

      {isLoading ? (
        <Text className="text-gray-500">Loading...</Text>
      ) : (
        <FlatList
          data={boards}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleOpen(item)}
              onLongPress={() => handleDelete(item)}
              className="bg-white rounded-xl p-4 mb-3"
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 })}
            >
              <Text className="text-gray-900 text-lg font-semibold">
                {item.name}
              </Text>
              <Text className="text-gray-500 text-sm mt-1">
                {item.buttons.filter((b) => b.soundUri).length} / {item.buttons.length} sounds
              </Text>
              <Text className="text-gray-400 text-xs mt-1">Hold to delete</Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text className="text-gray-500 text-center mt-8">
              No soundboards yet. Create one!
            </Text>
          }
        />
      )}

      {showInput && (
        <TextInput
          value={newName}
          onChangeText={setNewName}
          placeholder="Board name..."
          placeholderTextColor="#6b7280"
          autoFocus
          onSubmitEditing={handleCreate}
          className="bg-white text-gray-900 rounded-xl px-4 py-3 mb-3 border border-gray-300"
        />
      )}

      <Pressable
        onPress={handleCreate}
        className="bg-teal-500 rounded-xl py-4 items-center mb-6"
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
      >
        <Text className="text-white font-bold text-lg">+ Create Board</Text>
      </Pressable>
    </View>
  );
}
