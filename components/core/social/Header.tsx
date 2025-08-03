import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface HeaderProps {
  title: string;
  onSearch: () => void;
  onFilter?: (filter: 'ALL' | 'REGULAR' | 'DONATION' | 'TOKEN_CALL') => void;
}

const Header: React.FC<HeaderProps> = ({ title, onSearch, onFilter }) => {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  const handleFilterPress = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleFilter = (
    filter: 'ALL' | 'REGULAR' | 'DONATION' | 'TOKEN_CALL'
  ) => {
    onFilter?.(filter);
    setIsDropdownOpen(false);
  };

  return (
    <View className="flex-row items-center justify-between px-6 py-4">
      <Text className="text-white text-2xl font-bold">{title}</Text>
      <View className="flex-row gap-3">
        {onFilter && (
          <View className="relative">
            <TouchableOpacity
              className="w-10 h-10 bg-secondary-light rounded-full justify-center items-center"
              onPress={handleFilterPress}
            >
              <Ionicons name="filter" size={20} color={Colors.dark.text} />
            </TouchableOpacity>
            {isDropdownOpen && (
              <View
                className="absolute z-40 w-48 right-0 top-12 bg-secondary-light rounded-xl overflow-hidden shadow-2xl"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  elevation: 5,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.1)'
                }}
              >
                <View className="py-1">
                  <TouchableOpacity
                    className="px-4 py-3 flex-row items-center hover:bg-white/5 active:opacity-80"
                    onPress={() => handleFilter('ALL')}
                  >
                    <Ionicons name="grid-outline" size={18} color="#00C2CB" style={{ width: 24 }} />
                    <Text className="text-white font-medium text-base ml-2">
                      All Posts
                    </Text>
                  </TouchableOpacity>
                  <View className="h-px bg-white/5 mx-4" />
                  <TouchableOpacity
                    className="px-4 py-3 flex-row items-center hover:bg-white/5 active:opacity-80"
                    onPress={() => handleFilter('REGULAR')}
                  >
                    <Ionicons name="chatbubble-outline" size={18} color="#00C2CB" style={{ width: 24 }} />
                    <Text className="text-white font-medium text-base ml-2">
                      Regular
                    </Text>
                  </TouchableOpacity>
                  <View className="h-px bg-white/5 mx-4" />
                  <TouchableOpacity
                    className="px-4 py-3 flex-row items-center hover:bg-white/5 active:opacity-80"
                    onPress={() => handleFilter('DONATION')}
                  >
                    <Ionicons name="gift-outline" size={18} color="#00C2CB" style={{ width: 24 }} />
                    <Text className="text-white font-medium text-base ml-2">
                      Donations
                    </Text>
                  </TouchableOpacity>
                  <View className="h-px bg-white/5 mx-4" />
                  <TouchableOpacity
                    className="px-4 py-3 flex-row items-center hover:bg-white/5 active:opacity-80"
                    onPress={() => handleFilter('TOKEN_CALL')}
                  >
                    <Ionicons name="megaphone-outline" size={18} color="#00C2CB" style={{ width: 24 }} />
                    <Text className="text-white font-medium text-base ml-2">
                      Token Calls
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
        <TouchableOpacity
          className="w-10 h-10 bg-secondary-light rounded-full justify-center items-center"
          onPress={onSearch}
        >
          <Ionicons name="search" size={20} color={Colors.dark.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Header;
