import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
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

  const handleOpenModal = () => {
    if (boards.length >= MAX_BOARDS) {
      Alert.alert("Limit reached", `You can have up to ${MAX_BOARDS} soundboards.`);
      return;
    }
    setShowInput(true);
  };

  const handleCreate = async () => {
    const name = newName.trim() || `Board ${boards.length + 1}`;
    await createBoard(name);
    setNewName("");
    setShowInput(false);
  };

  const handleCancel = () => {
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
    <View className="flex-1 bg-gray-100 dark:bg-gray-900 px-4 pt-4">
      <Text className="text-gray-900 dark:text-gray-100 text-2xl font-bold mb-4">
        My Soundboards
      </Text>

      {isLoading ? (
        <Text className="text-gray-500 dark:text-gray-400">Loading...</Text>
      ) : (
        <FlatList
          data={boards}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleOpen(item)}
              onLongPress={() => handleDelete(item)}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3"
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 })}
            >
              <Text className="text-gray-900 dark:text-gray-100 text-lg font-semibold">
                {item.name}
              </Text>
              <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                {item.buttons.filter((b) => b.soundUri).length} / {item.buttons.length} sounds
              </Text>
              <Text className="text-gray-400 dark:text-gray-500 text-xs mt-1">Hold to delete</Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text className="text-gray-500 dark:text-gray-400 text-center mt-8">
              No soundboards yet. Create one!
            </Text>
          }
        />
      )}

      <Pressable
        onPress={handleOpenModal}
        className="bg-teal-500 rounded-xl py-4 items-center mb-6"
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
      >
        <Text className="text-white font-bold text-lg">+ Create Board</Text>
      </Pressable>

      <Modal visible={showInput} transparent animationType="fade" onRequestClose={handleCancel}>
        <Pressable className="flex-1 bg-black/50 justify-center px-6" onPress={handleCancel}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <Pressable onPress={() => {}}>
              <View className="bg-white dark:bg-gray-800 rounded-2xl p-6">
                <Text className="text-gray-900 dark:text-gray-100 text-lg font-bold mb-4">New Soundboard</Text>
                <TextInput
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Board name..."
                  placeholderTextColor="#6b7280"
                  autoFocus
                  onSubmitEditing={handleCreate}
                  returnKeyType="done"
                  className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-3 mb-4 border border-gray-200 dark:border-gray-600"
                />
                <View className="flex-row gap-3">
                  <Pressable onPress={handleCancel} className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-xl py-3 items-center">
                    <Text className="text-gray-700 dark:text-gray-200 font-semibold">Cancel</Text>
                  </Pressable>
                  <Pressable onPress={handleCreate} className="flex-1 bg-teal-500 rounded-xl py-3 items-center">
                    <Text className="text-white font-semibold">Create</Text>
                  </Pressable>
                </View>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </View>
  );
}
